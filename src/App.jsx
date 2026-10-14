import React, { useState, useEffect, useRef } from 'react';
import {
  Check, X, Plus, Trash2, Bell, Calendar, UserPlus,
  Smartphone, Download, Upload, FileJson, FolderOpen,
  Save, Sun, CloudSun, Moon, Pill, CheckCircle2, Link2,
  Utensils, CalendarClock, Repeat
} from 'lucide-react';

// ==========================================
// 1. DEFAULT JSON FILE STRUCTURE
// ==========================================
const SESSION_BUFFER_KEY = 'medtrack_file_buffer_v2';
const DEFAULT_FILENAME = 'medtrack-data.json';

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TODAY_STR = formatDateKey(new Date());

const DEFAULT_FILE_DATA = {
  appName: 'MedTrack Family Tablet Tracker',
  updatedAt: new Date().toISOString(),
  members: [
    { id: 'm1', name: 'Chaithanya', avatar: '👨🏽' },
    { id: 'm2', name: 'Divya', avatar: '👩🏽' },
    { id: 'm3', name: 'Yuvansh', avatar: '👦🏽' }
  ],
  medications: [
    {
      id: 'med1',
      memberId: 'm1',
      name: 'Vitamin D3',
      dosage: '60000 IU',
      slots: ['morning'],
      foodTiming: 'after', // 'before' | 'after' | 'with' | 'any'
      frequencyType: 'weekly', // 'daily' | 'weekly' | 'schedule'
      weekDays: [0], // 0 = Sunday
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    },
    {
      id: 'med2',
      memberId: 'm1',
      name: 'Pantoprazole',
      dosage: '40mg',
      slots: ['morning'],
      foodTiming: 'before',
      frequencyType: 'daily',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    },
    {
      id: 'med3',
      memberId: 'm2',
      name: 'Calcium + Vit D',
      dosage: '500mg',
      slots: ['afternoon'],
      foodTiming: 'after',
      frequencyType: 'daily',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    },
    {
      id: 'med4',
      memberId: 'm3',
      name: 'Multivitamin Drops',
      dosage: '5ml',
      slots: ['morning'],
      foodTiming: 'after',
      frequencyType: 'schedule',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 2, // Every 2 days
      startDate: TODAY_STR,
      endDate: ''
    }
  ],
  // Format: { "YYYY-MM-DD": { "medId_slot": "taken" | "skipped" } }
  logs: {},
  reminders: {
    morning: { time: '08:00', enabled: true },
    afternoon: { time: '13:30', enabled: true },
    night: { time: '21:00', enabled: true }
  }
};

const loadInitialBuffer = () => {
  try {
    const cached = localStorage.getItem(SESSION_BUFFER_KEY);
    if (cached) return { ...DEFAULT_FILE_DATA, ...JSON.parse(cached) };
  } catch (e) {
    console.warn('Could not read session buffer:', e);
  }
  return DEFAULT_FILE_DATA;
};

// ==========================================
// 2. CONSTANTS & SCHEDULE EVALUATOR
// ==========================================
const SLOTS = [
  { id: 'morning', label: 'Morning', emoji: '☀️', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌤️', icon: CloudSun, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'night', label: 'Night', emoji: '🌙', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' }
];

const FOOD_OPTIONS = [
  { id: 'before', label: 'Before Food', short: 'Before Meal', emoji: '🍽️⬅️', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'after', label: 'After Food', short: 'After Meal', emoji: '🍽️➡️', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'with', label: 'With Food', short: 'With Meal', emoji: '🥗', badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { id: 'any', label: 'Anytime', short: 'No Food Rule', emoji: '💧', badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' }
];

const WEEKDAY_LABELS = [
  { day: 1, short: 'M', name: 'Mon' },
  { day: 2, short: 'T', name: 'Tue' },
  { day: 3, short: 'W', name: 'Wed' },
  { day: 4, short: 'T', name: 'Thu' },
  { day: 5, short: 'F', name: 'Fri' },
  { day: 6, short: 'S', name: 'Sat' },
  { day: 0, short: 'S', name: 'Sun' }
];

// Evaluates if a tablet is scheduled for a given "YYYY-MM-DD" date
const isMedScheduledForDate = (med, dateKey) => {
  const target = new Date(`${dateKey}T00:00:00`);
  const freq = med.frequencyType || 'daily';

  if (freq === 'daily') {
    return true;
  }

  if (freq === 'weekly') {
    const days = Array.isArray(med.weekDays) ? med.weekDays : [0, 1, 2, 3, 4, 5, 6];
    return days.includes(target.getDay());
  }

  if (freq === 'schedule') {
    const startStr = med.startDate || TODAY_STR;
    const start = new Date(`${startStr}T00:00:00`);
    if (target < start) return false;

    if (med.endDate) {
      const end = new Date(`${med.endDate}T00:00:00`);
      if (target > end) return false;
    }

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, parseInt(med.intervalDays, 10) || 1);
    return diffDays % interval === 0;
  }

  return true;
};

// Human-readable summary of a medication's schedule
const getScheduleBadgeText = (med) => {
  const freq = med.frequencyType || 'daily';
  if (freq === 'daily') return 'Every Day';
  if (freq === 'weekly') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = (med.weekDays || []).map((d) => dayNames[d]).join(', ');
    return `Weekly (${days || 'None'})`;
  }
  if (freq === 'schedule') {
    const n = parseInt(med.intervalDays, 10) || 1;
    const base = n === 1 ? 'Daily Course' : `Every ${n} Days`;
    if (med.endDate) return `${base} (until ${med.endDate})`;
    return `${base} (from ${med.startDate || TODAY_STR})`;
  }
  return 'Daily';
};

const getCurrentWeekDays = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: formatDateKey(d),
      shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: formatDateKey(d) === formatDateKey(new Date())
    };
  });
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function App() {
  const [appData, setAppData] = useState(loadInitialBuffer);
  const [activeMemberId, setActiveMemberId] = useState(() => loadInitialBuffer().members[0]?.id || 'm1');
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly' | 'reminders' | 'simulator' | 'file'

  // Simple File Storage State
  const [fileHandle, setFileHandle] = useState(null);
  const [linkedFileName, setLinkedFileName] = useState(DEFAULT_FILENAME);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Add Member Modal State
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('🧑🏽');

  // Add Tablet Modal State (with Food Timing & Schedule Options)
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedSlots, setNewMedSlots] = useState(['morning']);
  const [newMedFood, setNewMedFood] = useState('after'); // 'before' | 'after' | 'with' | 'any'
  const [newMedFreqType, setNewMedFreqType] = useState('daily'); // 'daily' | 'weekly' | 'schedule'
  const [newMedWeekDays, setNewMedWeekDays] = useState([1, 3, 5]); // Default Mon, Wed, Fri when switching to weekly
  const [newMedInterval, setNewMedInterval] = useState(2); // Every N days
  const [newMedStartDate, setNewMedStartDate] = useState(TODAY_STR);
  const [newMedEndDate, setNewMedEndDate] = useState('');

  // 2-Second Hold Simulator
  const [isHoldingIcon, setIsHoldingIcon] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const holdTimerRef = useRef(null);

  const todayKey = formatDateKey(new Date());
  const weekDays = getCurrentWeekDays();
  const activeMember = appData.members.find((m) => m.id === activeMemberId) || appData.members[0];
  const memberMeds = appData.medications.filter((m) => m.memberId === activeMember?.id);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Sync changes to session buffer and linked file
  const updateDataAndSyncFile = async (updaterFn) => {
    setAppData((prev) => {
      const next = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
      const updatedPayload = { ...next, updatedAt: new Date().toISOString() };

      try {
        localStorage.setItem(SESSION_BUFFER_KEY, JSON.stringify(updatedPayload));
      } catch (e) {}

      if (fileHandle) {
        writeToLinkedFile(fileHandle, updatedPayload);
      } else {
        setUnsavedChanges(true);
      }

      return updatedPayload;
    });
  };

  const writeToLinkedFile = async (handle, dataObj) => {
    try {
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(dataObj, null, 2));
      await writable.close();
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to auto-write to linked file:', err);
      setUnsavedChanges(true);
    }
  };

  const saveToFileDownload = async () => {
    const jsonString = JSON.stringify(appData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = linkedFileName || DEFAULT_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setUnsavedChanges(false);
    showToast(`💾 Saved values to ${linkedFileName}`);
  };

  const handleLoadFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.members && parsed.medications && parsed.logs) {
          setAppData(parsed);
          localStorage.setItem(SESSION_BUFFER_KEY, JSON.stringify(parsed));
          setActiveMemberId(parsed.members[0]?.id || 'm1');
          setLinkedFileName(file.name);
          setUnsavedChanges(false);
          showToast(`📂 Loaded ${file.name} successfully!`);
        } else {
          showToast('⚠️ Invalid MedTrack JSON file structure.');
        }
      } catch {
        showToast('⚠️ Error reading JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const linkDirectLocalFile = async () => {
    if (!('showSaveFilePicker' in window)) {
      showToast('Direct file linking is not supported on this browser. Use "Save File" button instead!');
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: DEFAULT_FILENAME,
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
      });
      setFileHandle(handle);
      setLinkedFileName(handle.name);
      await writeToLinkedFile(handle, appData);
      showToast(`🔗 Linked to ${handle.name}! Every tap now saves directly to this file.`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Could not link local file.');
      }
    }
  };

  // Handle 2-Second Hold OS Shortcut URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const slot = params.get('slot');
    if (action === 'quick-log' && ['morning', 'afternoon', 'night'].includes(slot)) {
      markSlotBatch(slot, 'taken');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ==========================================
  // 4. TABLET INTAKE ACTIONS
  // ==========================================
  const setMedStatus = (dateKey, medId, slotId, status) => {
    updateDataAndSyncFile((prev) => {
      const dayLogs = { ...(prev.logs[dateKey] || {}) };
      const key = `${medId}_${slotId}`;
      if (dayLogs[key] === status) {
        delete dayLogs[key];
      } else {
        dayLogs[key] = status;
      }
      return { ...prev, logs: { ...prev.logs, [dateKey]: dayLogs } };
    });
  };

  const cycleMedStatus = (dateKey, medId, slotId) => {
    const current = appData.logs[dateKey]?.[`${medId}_${slotId}`] || 'pending';
    const next = current === 'pending' ? 'taken' : current === 'taken' ? 'skipped' : 'pending';
    setMedStatus(dateKey, medId, slotId, next === 'pending' ? current : next);
  };

  const markSlotBatch = (slotId, status = 'taken') => {
    const slotMeds = memberMeds.filter(
      (m) => m.slots.includes(slotId) && isMedScheduledForDate(m, todayKey)
    );
    if (slotMeds.length === 0) {
      showToast(`No ${slotId} tablets scheduled today for ${activeMember?.name}`);
      return;
    }
    updateDataAndSyncFile((prev) => {
      const dayLogs = { ...(prev.logs[todayKey] || {}) };
      slotMeds.forEach((m) => {
        dayLogs[`${m.id}_${slotId}`] = status;
      });
      return { ...prev, logs: { ...prev.logs, [todayKey]: dayLogs } };
    });
    const slotInfo = SLOTS.find((s) => s.id === slotId);
    showToast(`${slotInfo?.emoji} Marked today's ${slotInfo?.label} tablets as ${status}!`);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const newMember = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      avatar: newMemberAvatar
    };
    updateDataAndSyncFile((prev) => ({ ...prev, members: [...prev.members, newMember] }));
    setActiveMemberId(newMember.id);
    setNewMemberName('');
    setShowAddMember(false);
    showToast(`Added ${newMember.name}`);
  };

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!newMedName.trim() || newMedSlots.length === 0) return;
    if (newMedFreqType === 'weekly' && newMedWeekDays.length === 0) {
      showToast('Please select at least one day of the week!');
      return;
    }

    const med = {
      id: `med_${Date.now()}`,
      memberId: activeMember.id,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 Tablet',
      slots: newMedSlots,
      foodTiming: newMedFood,
      frequencyType: newMedFreqType,
      weekDays: newMedFreqType === 'weekly' ? newMedWeekDays : [0, 1, 2, 3, 4, 5, 6],
      intervalDays: newMedFreqType === 'schedule' ? Math.max(1, parseInt(newMedInterval, 10) || 1) : 1,
      startDate: newMedStartDate || TODAY_STR,
      endDate: newMedFreqType === 'schedule' ? newMedEndDate : ''
    };

    updateDataAndSyncFile((prev) => ({ ...prev, medications: [...prev.medications, med] }));
    setNewMedName('');
    setNewMedDosage('');
    setNewMedSlots(['morning']);
    setNewMedFood('after');
    setNewMedFreqType('daily');
    setNewMedEndDate('');
    setShowAddMed(false);
    showToast(`Added ${med.name} (${getScheduleBadgeText(med)})`);
  };

  const handleDeleteMedication = (medId) => {
    updateDataAndSyncFile((prev) => ({
      ...prev,
      medications: prev.medications.filter((m) => m.id !== medId)
    }));
    showToast('Tablet removed');
  };

  // ==========================================
  // 5. 2-SECOND HOLD SIMULATOR
  // ==========================================
  const startHold = () => {
    setIsHoldingIcon(true);
    setHoldProgress(0);
    setShowShortcutPopup(false);
    const startTime = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
      setHoldProgress(pct);
      if (elapsed >= 2000) {
        clearInterval(holdTimerRef.current);
        setIsHoldingIcon(false);
        setShowShortcutPopup(true);
        if (navigator.vibrate) navigator.vibrate(60);
      }
    }, 50);
  };

  const endHold = () => {
    clearInterval(holdTimerRef.current);
    setIsHoldingIcon(false);
    if (holdProgress < 100) setHoldProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hidden File Input for Opening JSON File */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleLoadFromFile}
        className="hidden"
      />

      {/* Top Header with Save File & Open File Buttons */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight flex items-center gap-2">
                <span>MedTrack</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {fileHandle ? `🔗 Auto-Saving: ${linkedFileName}` : linkedFileName}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Food Timing & Schedule-Aware Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveToFileDownload}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer ${
                unsavedChanges
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{unsavedChanges ? 'Save File *' : 'Save File'}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Open File</span>
            </button>
          </div>
        </div>

        {/* Family Member Selector */}
        <div className="max-w-4xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {appData.members.map((member) => {
            const active = member.id === activeMember?.id;
            return (
              <button
                key={member.id}
                onClick={() => setActiveMemberId(member.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-indigo-400 border border-dashed border-slate-700 whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Member</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-6">
        {/* ==========================================
            TAB 1: TODAY'S TABLETS
           ========================================== */}
        {activeTab === 'today' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                  Today • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <h2 className="text-lg font-bold mt-0.5">
                  {activeMember?.avatar} {activeMember?.name}’s Tablets
                </h2>
              </div>
              <button
                onClick={() => setShowAddMed(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tablet</span>
              </button>
            </div>

            {SLOTS.map((slot) => {
              // Filter by slot AND whether it is scheduled for today
              const slotMeds = memberMeds.filter(
                (m) => m.slots.includes(slot.id) && isMedScheduledForDate(m, todayKey)
              );
              const offTodayCount = memberMeds.filter(
                (m) => m.slots.includes(slot.id) && !isMedScheduledForDate(m, todayKey)
              ).length;

              return (
                <div key={slot.id} className={`rounded-2xl border ${slot.border} bg-slate-900/70 overflow-hidden`}>
                  <div className={`px-4 py-3 ${slot.bg} flex items-center justify-between border-b border-slate-800/80`}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{slot.emoji}</span>
                      <div>
                        <h3 className={`font-bold text-sm ${slot.color}`}>{slot.label}</h3>
                        <p className="text-[11px] text-slate-400">
                          Reminder: {appData.reminders[slot.id]?.time}
                          {offTodayCount > 0 && ` • (${offTodayCount} non-today scheduled med hidden)`}
                        </p>
                      </div>
                    </div>
                    {slotMeds.length > 0 && (
                      <button
                        onClick={() => markSlotBatch(slot.id, 'taken')}
                        className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 font-medium transition cursor-pointer"
                      >
                        ✓ Mark All {slot.label}
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-800/60">
                    {slotMeds.length === 0 ? (
                      <p className="text-xs text-slate-500 py-5 text-center">
                        No {slot.label.toLowerCase()} tablets due today for {activeMember?.name}.
                      </p>
                    ) : (
                      slotMeds.map((med) => {
                        const status = appData.logs[todayKey]?.[`${med.id}_${slot.id}`] || 'pending';
                        const foodMeta = FOOD_OPTIONS.find((f) => f.id === (med.foodTiming || 'after')) || FOOD_OPTIONS[1];

                        return (
                          <div key={med.id} className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
                                <span>{med.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                                  {med.dosage}
                                </span>
                                {/* Before / After Food Badge */}
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${foodMeta.badgeClass}`}>
                                  {foodMeta.emoji} {foodMeta.label}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span className="inline-flex items-center gap-1 text-slate-300">
                                  <Repeat className="w-3 h-3 text-indigo-400" />
                                  {getScheduleBadgeText(med)}
                                </span>
                                <span>•</span>
                                <span>
                                  Status:{' '}
                                  <span
                                    className={
                                      status === 'taken'
                                        ? 'text-emerald-400 font-semibold'
                                        : status === 'skipped'
                                        ? 'text-rose-400 font-semibold'
                                        : 'text-amber-400'
                                    }
                                  >
                                    {status.toUpperCase()}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                onClick={() => setMedStatus(todayKey, med.id, slot.id, 'taken')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                  status === 'taken'
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Take
                              </button>
                              <button
                                onClick={() => setMedStatus(todayKey, med.id, slot.id, 'skipped')}
                                className={`p-1.5 rounded-xl text-xs transition cursor-pointer ${
                                  status === 'skipped'
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedication(med.id)}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==========================================
            TAB 2: WEEKLY VIEW (SCHEDULE AWARE)
           ========================================== */}
        {activeTab === 'weekly' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">
                  Weekly Schedule View — {activeMember?.avatar} {activeMember?.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Tap any active ☀️, 🌤️, or 🌙 slot to mark Taken (✓) or Skipped (✕). Non-scheduled days show <code>—</code>.
                </p>
              </div>
              <button
                onClick={() => setShowAddMed(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tablet</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-3 pr-3 font-semibold">Tablet / Food / Frequency</th>
                    {weekDays.map((d) => (
                      <th
                        key={d.key}
                        className={`py-2 px-2 text-center rounded-t-lg ${
                          d.isToday ? 'bg-indigo-500/10 text-indigo-300 font-bold' : ''
                        }`}
                      >
                        <div>{d.shortDay}</div>
                        <div className="text-[11px] opacity-80">{d.dayNum}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {memberMeds.map((med) => {
                    const foodMeta = FOOD_OPTIONS.find((f) => f.id === (med.foodTiming || 'after')) || FOOD_OPTIONS[1];
                    return (
                      <tr key={med.id}>
                        <td className="py-3 pr-3 font-medium space-y-1">
                          <div className="text-slate-100 flex items-center gap-1.5">
                            <span>{med.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({med.dosage})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${foodMeta.badgeClass}`}>
                              {foodMeta.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {getScheduleBadgeText(med)}
                            </span>
                          </div>
                        </td>
                        {weekDays.map((d) => {
                          const scheduled = isMedScheduledForDate(med, d.key);
                          return (
                            <td key={d.key} className={`py-2.5 px-1.5 text-center ${d.isToday ? 'bg-indigo-500/5' : ''}`}>
                              {!scheduled ? (
                                <span
                                  className="inline-block text-[11px] text-slate-600 select-none"
                                  title="Not scheduled for this day"
                                >
                                  —
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {med.slots.map((slotId) => {
                                    const slotMeta = SLOTS.find((s) => s.id === slotId);
                                    const st = appData.logs[d.key]?.[`${med.id}_${slotId}`] || 'pending';
                                    return (
                                      <button
                                        key={slotId}
                                        onClick={() => cycleMedStatus(d.key, med.id, slotId)}
                                        className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] border transition cursor-pointer ${
                                          st === 'taken'
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                                            : st === 'skipped'
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                                        }`}
                                      >
                                        <span>{slotMeta?.emoji}</span>
                                        <span className="leading-none">
                                          {st === 'taken' ? '✓' : st === 'skipped' ? '✕' : '·'}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: REMINDERS
           ========================================== */}
        {activeTab === 'reminders' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <span>Morning / Afternoon / Night Reminders</span>
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {SLOTS.map((slot) => {
                const rem = appData.reminders[slot.id];
                const dueMeds = memberMeds.filter(
                  (m) => m.slots.includes(slot.id) && isMedScheduledForDate(m, todayKey)
                );
                return (
                  <div key={slot.id} className={`p-4 rounded-xl border ${slot.border} bg-slate-950/60 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold flex items-center gap-2">
                        <span>{slot.emoji}</span>
                        <span className={slot.color}>{slot.label}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={rem?.enabled ?? true}
                        onChange={(e) =>
                          updateDataAndSyncFile((prev) => ({
                            ...prev,
                            reminders: {
                              ...prev.reminders,
                              [slot.id]: { ...prev.reminders[slot.id], enabled: e.target.checked }
                            }
                          }))
                        }
                        className="w-4 h-4 accent-indigo-500"
                      />
                    </div>
                    <input
                      type="time"
                      value={rem?.time || '08:00'}
                      onChange={(e) =>
                        updateDataAndSyncFile((prev) => ({
                          ...prev,
                          reminders: {
                            ...prev.reminders,
                            [slot.id]: { ...prev.reminders[slot.id], time: e.target.value }
                          }
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <div className="text-[11px] text-slate-400 space-y-1">
                      {dueMeds.length === 0 ? (
                        <div>No tablets due today in this slot.</div>
                      ) : (
                        dueMeds.map((m) => {
                          const f = FOOD_OPTIONS.find((x) => x.id === (m.foodTiming || 'after'));
                          return (
                            <div key={m.id} className="flex items-center justify-between text-slate-300">
                              <span>• {m.name}</span>
                              <span className="text-amber-300">{f?.label}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      onClick={() =>
                        showToast(`${slot.emoji} Reminder: Take ${activeMember?.name}'s ${slot.label} tablets (check Before/After food)!`)
                      }
                      className="w-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      Test {slot.emoji} Alert
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: 2-SECOND HOLD SIMULATOR
           ========================================== */}
        {activeTab === 'simulator' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5">
            <h2 className="text-base font-bold">2-Second Home Screen Hold Simulator</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Press and hold the MedTrack icon for 2 seconds to trigger the quick-mark menu.
            </p>

            <div className="relative mx-auto w-72 h-96 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 border-4 border-slate-700 shadow-2xl flex flex-col items-center justify-end pb-14 select-none">
              {showShortcutPopup && (
                <div className="absolute bottom-36 w-60 bg-slate-900/95 border border-slate-700 rounded-2xl p-2 shadow-2xl text-left space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400 flex items-center justify-between">
                    <span>Quick Log ({activeMember?.name})</span>
                    <button onClick={() => setShowShortcutPopup(false)}>✕</button>
                  </div>
                  {SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        markSlotBatch(slot.id, 'taken');
                        setShowShortcutPopup(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-600/20 text-xs font-medium text-slate-100"
                    >
                      <span className="text-base">{slot.emoji}</span>
                      <span>Mark {slot.label} Taken</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <button
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl transition-transform ${
                    isHoldingIcon ? 'scale-90 ring-4 ring-indigo-400/50' : ''
                  }`}
                >
                  <Pill className="w-8 h-8 text-white" />
                </button>
                <span className="text-xs font-medium text-slate-200">MedTrack</span>
                {isHoldingIcon && (
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400" style={{ width: `${holdProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: SIMPLE JSON FILE VIEWER & CONTROLS
           ========================================== */}
        {activeTab === 'file' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-indigo-400" />
                  <span>Simple File Storage ({linkedFileName})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Save all members, food timings, schedules, and daily intake marks into a single portable <code>.json</code> file.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={saveToFileDownload}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .JSON File</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Load .JSON File</span>
                </button>

                <button
                  onClick={linkDirectLocalFile}
                  className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-500/30 transition cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{fileHandle ? 'Linked to Local File ✓' : 'Auto-Sync Local File'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-400 font-medium">
                Live File Contents Preview (<code>{linkedFileName}</code>):
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-[11px] text-emerald-300 overflow-x-auto max-h-80 font-mono">
                {JSON.stringify(appData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMember}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4"
          >
            <h3 className="font-bold text-base">Add Family Member</h3>
            <input
              type="text"
              placeholder="Member Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
              required
            />
            <div className="flex gap-2">
              {['👨🏽', '👩🏽', '👦🏽', '👧🏽', '👴🏽', '👵🏽'].map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setNewMemberAvatar(av)}
                  className={`text-xl p-2 rounded-xl border ${
                    newMemberAvatar === av ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs bg-indigo-600 text-white font-semibold">
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          ADD TABLET MODAL (WITH FOOD & SCHEDULE OPTIONS)
         ========================================== */}
      {showAddMed && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleAddMedication}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">
                Add Tablet for {activeMember?.avatar} {activeMember?.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Name & Dosage */}
            <div className="grid grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Tablet Name (e.g., Dolo 650)"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white"
                required
              />
              <input
                type="text"
                placeholder="Dosage (500mg)"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white"
              />
            </div>

            {/* 1. Food Timing Selector (Before / After / With Food) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-400" />
                <span>Food Timing (Before or After Food)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FOOD_OPTIONS.map((food) => {
                  const selected = newMedFood === food.id;
                  return (
                    <button
                      type="button"
                      key={food.id}
                      onClick={() => setNewMedFood(food.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm">{food.emoji}</span>
                      <span>{food.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Time of Day Slots (Morning / Afternoon / Night) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Time of Day</label>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s) => {
                  const selected = newMedSlots.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() =>
                        setNewMedSlots((prev) =>
                          prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                        )
                      }
                      className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Frequency / Schedule Selector (Daily, Weekly, Schedule Based) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Schedule Type</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'daily', label: 'Daily' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'schedule', label: 'Custom Schedule' }
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setNewMedFreqType(tab.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      newMedFreqType === tab.id
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Conditional Sub-Options for WEEKLY */}
              {newMedFreqType === 'weekly' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400">Select which days of the week:</div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAY_LABELS.map((w) => {
                      const active = newMedWeekDays.includes(w.day);
                      return (
                        <button
                          type="button"
                          key={w.day}
                          onClick={() =>
                            setNewMedWeekDays((prev) =>
                              prev.includes(w.day) ? prev.filter((d) => d !== w.day) : [...prev, w.day]
                            )
                          }
                          className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            active
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {w.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Conditional Sub-Options for CUSTOM SCHEDULE (Every N Days & Start/End Date) */}
              {newMedFreqType === 'schedule' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">Repeat every:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={newMedInterval}
                        onChange={(e) => setNewMedInterval(e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center text-white font-bold"
                      />
                      <span className="text-slate-400">days</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={newMedStartDate}
                        onChange={(e) => setNewMedStartDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={newMedEndDate}
                        onChange={(e) => setNewMedEndDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddMed(false)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
              >
                Save Tablet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-5 py-2">
          {[
            { id: 'today', label: 'Today', icon: CheckCircle2 },
            { id: 'weekly', label: 'Weekly Grid', icon: Calendar },
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'simulator', label: '2s Hold', icon: Smartphone },
            { id: 'file', label: 'JSON File', icon: FileJson }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 text-[11px] font-medium transition cursor-pointer ${
                  active ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}