import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sun,
  CloudSun,
  Moon,
  Check,
  X,
  Plus,
  Bell,
  Calendar,
  UserPlus,
  Users,
  Pill,
  Smartphone,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Zap,
  Sparkles,
  Volume2,
  ShieldCheck,
  Award,
  RefreshCw,
  Info,
  Settings,
  ExternalLink
} from 'lucide-react';

// --- HELPER UTILITIES FOR DATES ---
const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- SLOT METADATA ---
const SLOTS = {
  morning: {
    id: 'morning',
    label: 'Morning',
    emoji: '☀️',
    defaultTime: '08:00',
    color: 'amber',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    textClass: 'text-amber-700 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    gradient: 'from-amber-400 to-orange-500'
  },
  afternoon: {
    id: 'afternoon',
    label: 'Afternoon',
    emoji: '🌤️',
    defaultTime: '13:30',
    color: 'sky',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    borderClass: 'border-sky-200 dark:border-sky-800/60',
    textClass: 'text-sky-700 dark:text-sky-300',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
    gradient: 'from-sky-400 to-blue-500'
  },
  night: {
    id: 'night',
    label: 'Night',
    emoji: '🌙',
    defaultTime: '21:00',
    color: 'indigo',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200 dark:border-indigo-800/60',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
    gradient: 'from-indigo-500 to-purple-600'
  }
};

// --- INITIAL SAMPLE DATA ---
const INITIAL_MEMBERS = [
  { id: 'mem-1', name: 'Aarav (Self)', role: 'Primary', avatar: '🧑‍💻', color: 'from-teal-500 to-emerald-600' },
  { id: 'mem-2', name: 'Meera (Mom)', role: 'Mother', avatar: '👩‍🦳', color: 'from-rose-500 to-pink-600' },
  { id: 'mem-3', name: 'Rajan (Dad)', role: 'Father', avatar: '👨‍🦳', color: 'from-blue-500 to-indigo-600' }
];

const INITIAL_MEDICATIONS = [
  // Aarav
  {
    id: 'med-1',
    memberId: 'mem-1',
    name: 'Vitamin D3 + K2',
    dosage: '2000 IU (1 Softgel)',
    form: 'Capsule',
    instruction: 'After Food',
    slots: ['morning'],
    notes: 'Take with breakfast for better absorption'
  },
  {
    id: 'med-2',
    memberId: 'mem-1',
    name: 'Omega-3 Fish Oil',
    dosage: '1000mg (1 Capsule)',
    form: 'Capsule',
    instruction: 'After Food',
    slots: ['afternoon', 'night'],
    notes: 'Supports heart & joint health'
  },
  {
    id: 'med-3',
    memberId: 'mem-1',
    name: 'Magnesium Glycinate',
    dosage: '400mg (1 Tablet)',
    form: 'Tablet',
    instruction: 'Before Sleep',
    slots: ['night'],
    notes: 'Take 30 mins before sleep'
  },
  // Meera (Mom)
  {
    id: 'med-4',
    memberId: 'mem-2',
    name: 'Thyronorm',
    dosage: '50mcg (1 Tablet)',
    form: 'Tablet',
    instruction: 'Empty Stomach',
    slots: ['morning'],
    notes: '30 mins before morning tea/breakfast'
  },
  {
    id: 'med-5',
    memberId: 'mem-2',
    name: 'Calcium + Calcitriol',
    dosage: '500mg (1 Tablet)',
    form: 'Tablet',
    instruction: 'After Food',
    slots: ['afternoon'],
    notes: 'Take after lunch'
  },
  {
    id: 'med-6',
    memberId: 'mem-2',
    name: 'Amlodipine (BP)',
    dosage: '5mg (1 Tablet)',
    form: 'Tablet',
    instruction: 'After Food',
    slots: ['night'],
    notes: 'Daily blood pressure maintenance'
  },
  // Rajan (Dad)
  {
    id: 'med-7',
    memberId: 'mem-3',
    name: 'Metformin SR',
    dosage: '500mg (1 Tablet)',
    form: 'Tablet',
    instruction: 'With Food',
    slots: ['morning', 'night'],
    notes: 'Blood sugar management'
  },
  {
    id: 'med-8',
    memberId: 'mem-3',
    name: 'Atorvastatin',
    dosage: '10mg (1 Tablet)',
    form: 'Tablet',
    instruction: 'After Food',
    slots: ['night'],
    notes: 'Cholesterol tablet after dinner'
  }
];

// Generate realistic pre-populated logs for the current week so weekly matrix looks alive
const buildDefaultLogs = () => {
  const logs = {};
  const today = new Date();
  const monday = getMonday(today);
  const todayKey = formatDateKey(today);

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(monday, i);
    const dKey = formatDateKey(dayDate);
    if (dKey < todayKey) {
      INITIAL_MEDICATIONS.forEach((med) => {
        med.slots.forEach((slot) => {
          // 88% taken in past days of current week
          const pseudoRand = (med.id.charCodeAt(4) + i + slot.length) % 8;
          logs[`${med.id}_${dKey}_${slot}`] = pseudoRand === 0 ? 'skipped' : 'taken';
        });
      });
    } else if (dKey === todayKey) {
      // Mark morning meds as taken for Aarav & Mom today
      logs[`med-1_${todayKey}_morning`] = 'taken';
      logs[`med-4_${todayKey}_morning`] = 'taken';
      logs[`med-7_${todayKey}_morning`] = 'taken';
    }
  }
  return logs;
};

// --- WEB AUDIO SYNTHESIZER FOR REMINDER CHIMES ---
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.11 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.38);
    });
  } catch (e) {
    // Ignore if audio context is blocked by autoplay policy
  }
};

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  // --- STATE WITH LOCALSTORAGE PERSISTENCE ---
  const [members, setMembers] = useState(() => {
    try {
      const saved = localStorage.getItem('medtrack_members_v1');
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [selectedMemberId, setSelectedMemberId] = useState(() => {
    return members[0]?.id || 'mem-1';
  });

  const [medications, setMedications] = useState(() => {
    try {
      const saved = localStorage.getItem('medtrack_meds_v1');
      return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
    } catch {
      return INITIAL_MEDICATIONS;
    }
  });

  const [intakeLogs, setIntakeLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('medtrack_logs_v1');
      return saved ? JSON.parse(saved) : buildDefaultLogs();
    } catch {
      return buildDefaultLogs();
    }
  });

  const [reminderSettings, setReminderSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('medtrack_reminders_v1');
      return saved
        ? JSON.parse(saved)
        : {
            enabled: true,
            sound: true,
            morning: '08:00',
            afternoon: '13:30',
            night: '21:00'
          };
    } catch {
      return {
        enabled: true,
        sound: true,
        morning: '08:00',
        afternoon: '13:30',
        night: '21:00'
      };
    }
  });

  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly' | 'meds' | 'reminders' | 'pwa'
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, +1 = next week
  const [quickLogDrawer, setQuickLogDrawer] = useState({ open: false, slot: 'all' });
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [medModal, setMedModal] = useState({ open: false, editingMed: null });
  const [activeAlertBanner, setActiveAlertBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('medtrack_members_v1', JSON.stringify(members));
    } catch {}
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('medtrack_meds_v1', JSON.stringify(medications));
    } catch {}
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem('medtrack_logs_v1', JSON.stringify(intakeLogs));
    } catch {}
  }, [intakeLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('medtrack_reminders_v1', JSON.stringify(reminderSettings));
    } catch {}
  }, [reminderSettings]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 3200);
  };

  // --- DYNAMIC PWA MANIFEST INJECTION & SHORTCUT URL LISTENER ---
  const manifestJSON = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '/';
    return {
      name: 'MedTrack Family Tablet & Pill Tracker',
      short_name: 'MedTrack',
      description: 'Per-person daily & weekly family tablet intake tracker with Morning, Afternoon & Night reminders.',
      start_url: `${baseUrl}?source=pwa`,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#0f172a',
      theme_color: '#0d9488',
      icons: [
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' rx='42' fill='%230d9488'/%3E%3Ccircle cx='96' cy='96' r='56' fill='%23ffffff' fill-opacity='0.15'/%3E%3Cpath d='M72 96a24 24 0 0 1 48 0v24a24 24 0 0 1-48 0V96z' fill='%23ffffff' transform='rotate(45 96 96)'/%3E%3Ccircle cx='138' cy='54' r='16' fill='%23fbbf24'/%3E%3C/svg%3E",
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        },
        {
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='112' fill='%230d9488'/%3E%3Cpath d='M192 256a64 64 0 0 1 128 0v64a64 64 0 0 1-128 0v-64z' fill='%23ffffff' transform='rotate(45 256 256)'/%3E%3Ccircle cx='368' cy='144' r='42' fill='%23fbbf24'/%3E%3C/svg%3E",
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ],
      // Native OS 2-Second Long-Press Home Screen Shortcuts
      shortcuts: [
        {
          name: 'Mark Morning Tablets ☀️',
          short_name: 'Morning ☀️',
          description: 'Quickly mark today’s morning tablets as taken',
          url: `${baseUrl}?action=quick-log&slot=morning`,
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%23f59e0b'/%3E%3Ccircle cx='48' cy='48' r='22' fill='%23fff'/%3E%3C/svg%3E",
              sizes: '96x96',
              type: 'image/svg+xml'
            }
          ]
        },
        {
          name: 'Mark Afternoon Tablets 🌤️',
          short_name: 'Afternoon 🌤️',
          description: 'Quickly mark today’s afternoon tablets as taken',
          url: `${baseUrl}?action=quick-log&slot=afternoon`,
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%230ea5e9'/%3E%3Ccircle cx='48' cy='48' r='22' fill='%23fff'/%3E%3C/svg%3E",
              sizes: '96x96',
              type: 'image/svg+xml'
            }
          ]
        },
        {
          name: 'Mark Night Tablets 🌙',
          short_name: 'Night 🌙',
          description: 'Quickly mark today’s night tablets as taken',
          url: `${baseUrl}?action=quick-log&slot=night`,
          icons: [
            {
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='24' fill='%236366f1'/%3E%3Ccircle cx='48' cy='48' r='22' fill='%23fff'/%3E%3C/svg%3E",
              sizes: '96x96',
              type: 'image/svg+xml'
            }
          ]
        },
        {
          name: 'Quick Mark All Due ⚡',
          short_name: 'Quick Mark ⚡',
          description: 'Open 1-tap tablet intake sheet immediately',
          url: `${baseUrl}?action=quick-log&slot=all`
        }
      ]
    };
  }, []);

  useEffect(() => {
    // 1. Inject Dynamic Manifest into <head>
    const stringManifest = JSON.stringify(manifestJSON);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    let linkEl = document.querySelector('link[rel="manifest"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'manifest';
      document.head.appendChild(linkEl);
    }
    linkEl.href = manifestURL;

    // Set theme-color meta for mobile status bar
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = '#0d9488';

    // 2. Check if launched from a 2-second Home Screen Long-Press Shortcut (?action=quick-log&slot=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const slot = params.get('slot') || 'all';
      if (action === 'quick-log') {
        setQuickLogDrawer({ open: true, slot });
      }
    }

    // 3. Listen for PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      URL.revokeObjectURL(manifestURL);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [manifestJSON]);

  // --- DERIVED DATA FOR SELECTED MEMBER & DATES ---
  const todayDate = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(todayDate), [todayDate]);

  const currentMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || members[0],
    [members, selectedMemberId]
  );

  const memberMedications = useMemo(
    () => medications.filter((m) => m.memberId === currentMember?.id),
    [medications, currentMember]
  );

  // 7 days of the selected week (Mon - Sun)
  const weekDays = useMemo(() => {
    const baseMonday = getMonday(new Date());
    const targetMonday = addDays(baseMonday, weekOffset * 7);
    return Array.from({ length: 7 }, (_, idx) => {
      const date = addDays(targetMonday, idx);
      const key = formatDateKey(date);
      return {
        date,
        key,
        dayName: SHORT_DAYS[idx],
        dayNum: date.getDate(),
        monthShort: date.toLocaleString('default', { month: 'short' }),
        isToday: key === todayKey
      };
    });
  }, [weekOffset, todayKey]);

  // Calculate Today's Progress for Selected Member
  const todayStats = useMemo(() => {
    let totalScheduled = 0;
    let totalTaken = 0;
    const bySlot = {
      morning: { total: 0, taken: 0, meds: [] },
      afternoon: { total: 0, taken: 0, meds: [] },
      night: { total: 0, taken: 0, meds: [] }
    };

    memberMedications.forEach((med) => {
      med.slots.forEach((slot) => {
        if (bySlot[slot]) {
          const status = intakeLogs[`${med.id}_${todayKey}_${slot}`] || 'pending';
          bySlot[slot].total += 1;
          bySlot[slot].meds.push({ ...med, status });
          totalScheduled += 1;
          if (status === 'taken') {
            bySlot[slot].taken += 1;
            totalTaken += 1;
          }
        }
      });
    });

    const percentage = totalScheduled === 0 ? 100 : Math.round((totalTaken / totalScheduled) * 100);
    return { totalScheduled, totalTaken, percentage, bySlot };
  }, [memberMedications, intakeLogs, todayKey]);

  // Calculate Weekly Adherence Percentage for Selected Member
  const weeklyAdherence = useMemo(() => {
    let scheduled = 0;
    let taken = 0;
    weekDays.forEach((day) => {
      // Count up to today or all week if past week
      if (day.key <= todayKey || weekOffset < 0) {
        memberMedications.forEach((med) => {
          med.slots.forEach((slot) => {
            scheduled += 1;
            if (intakeLogs[`${med.id}_${day.key}_${slot}`] === 'taken') {
              taken += 1;
            }
          });
        });
      }
    });
    const pct = scheduled === 0 ? 100 : Math.round((taken / scheduled) * 100);
    return { scheduled, taken, pct };
  }, [weekDays, memberMedications, intakeLogs, todayKey, weekOffset]);

  // --- INTAKE LOGGING HANDLERS ---
  const toggleIntakeStatus = (medId, dateKey, slot, forceStatus = null) => {
    const logKey = `${medId}_${dateKey}_${slot}`;
    setIntakeLogs((prev) => {
      const current = prev[logKey] || 'pending';
      let next;
      if (forceStatus) {
        next = forceStatus;
      } else {
        // Cycle: pending -> taken -> skipped -> pending
        if (current === 'pending') next = 'taken';
        else if (current === 'taken') next = 'skipped';
        else next = 'pending';
      }
      const updated = { ...prev };
      if (next === 'pending') {
        delete updated[logKey];
      } else {
        updated[logKey] = next;
      }
      return updated;
    });
  };

  const markSlotBatch = (slotId, memberId = currentMember.id, dateKey = todayKey) => {
    const medsForMember = medications.filter(
      (m) => m.memberId === memberId && (slotId === 'all' || m.slots.includes(slotId))
    );
    if (medsForMember.length === 0) {
      showToast('No tablets scheduled for this slot!', 'info');
      return;
    }

    setIntakeLogs((prev) => {
      const updated = { ...prev };
      medsForMember.forEach((med) => {
        med.slots.forEach((s) => {
          if (slotId === 'all' || s === slotId) {
            updated[`${med.id}_${dateKey}_${s}`] = 'taken';
          }
        });
      });
      return updated;
    });

    const slotName = slotId === 'all' ? 'All Today’s' : `${SLOTS[slotId].emoji} ${SLOTS[slotId].label}`;
    showToast(`Marked ${slotName} tablets as Taken!`, 'success');
  };

  // --- REMINDER & NOTIFICATION TRIGGER ---
  const triggerSlotReminder = (slotId) => {
    const slotInfo = SLOTS[slotId];
    const pendingMeds = [];

    members.forEach((member) => {
      const mMeds = medications.filter((m) => m.memberId === member.id && m.slots.includes(slotId));
      mMeds.forEach((med) => {
        const status = intakeLogs[`${med.id}_${todayKey}_${slotId}`];
        if (status !== 'taken') {
          pendingMeds.push({ member, med });
        }
      });
    });

    if (reminderSettings.sound) {
      playNotificationChime();
    }

    const alertPayload = {
      slotId,
      slotInfo,
      time: reminderSettings[slotId],
      pendingMeds,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveAlertBanner(alertPayload);

    // Also fire native browser Notification if granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const bodyText =
        pendingMeds.length > 0
          ? pendingMeds.map((p) => `${p.member.name.split(' ')[0]}: ${p.med.name} (${p.med.dosage})`).join(' • ')
          : `Time to check your ${slotInfo.label} tablet schedule!`;

      try {
        new Notification(`${slotInfo.emoji} ${slotInfo.label} Tablet Reminder`, {
          body: bodyText,
          tag: `medtrack-${slotId}`
        });
      } catch {}
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser notifications are not supported in this preview frame, using In-App Alert Banner!', 'info');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        showToast('System Notifications Enabled!', 'success');
        triggerSlotReminder('morning');
      } else {
        showToast('Using In-App Reminder Banner & Sound Chime.', 'info');
      }
    } catch {
      showToast('Using In-App Reminder Banner & Sound Chime.', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* --- FLOATING TOAST FEEDBACK --- */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-xl bg-slate-900 text-white dark:bg-teal-500 dark:text-slate-950 text-sm font-semibold border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-teal-400 dark:text-slate-950 shrink-0" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* --- IN-APP REMINDER BANNER (MORNING ☀️ / AFTERNOON 🌤️ / NIGHT 🌙) --- */}
      {activeAlertBanner && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-500/40 shadow-2xl px-4 py-3 animate-fadeIn">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl shrink-0 border border-white/15">
                {activeAlertBanner.slotInfo.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30">
                    {activeAlertBanner.slotInfo.label} Reminder • {activeAlertBanner.time}
                  </span>
                  <span className="text-xs text-slate-300">Active Alert</span>
                </div>
                <p className="text-sm font-medium text-slate-100 mt-1">
                  {activeAlertBanner.pendingMeds.length > 0 ? (
                    <>
                      Due now:{' '}
                      {activeAlertBanner.pendingMeds.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 mr-2 text-amber-200 font-semibold">
                          {item.member.avatar} {item.med.name} ({item.med.dosage})
                          {idx < Math.min(2, activeAlertBanner.pendingMeds.length - 1) ? ',' : ''}
                        </span>
                      ))}
                      {activeAlertBanner.pendingMeds.length > 3 && (
                        <span className="text-xs text-slate-300">
                          +{activeAlertBanner.pendingMeds.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    `All ${activeAlertBanner.slotInfo.label} tablets for your family are already marked taken!`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {activeAlertBanner.pendingMeds.length > 0 && (
                <button
                  onClick={() => {
                    // Mark all pending meds in this slot as taken
                    setIntakeLogs((prev) => {
                      const next = { ...prev };
                      activeAlertBanner.pendingMeds.forEach(({ med }) => {
                        next[`${med.id}_${todayKey}_${activeAlertBanner.slotId}`] = 'taken';
                      });
                      return next;
                    });
                    setActiveAlertBanner(null);
                    showToast(
                      `All ${activeAlertBanner.slotInfo.emoji} ${activeAlertBanner.slotInfo.label} tablets marked as Taken!`
                    );
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  Mark All Taken
                </button>
              )}
              <button
                onClick={() => setActiveAlertBanner(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
                title="Dismiss Reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP HEADER & MEMBER SWITCHER BAR --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                    MedTrack
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                    PWA Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Family Tablet & Weekly Intake Tracker
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickLogDrawer({ open: true, slot: 'all' })}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Quick 1-Tap Intake Sheet (Also triggered on 2s Home Screen Hold)"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Quick Mark</span>
              </button>

              <button
                onClick={() => setActiveTab('pwa')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                  activeTab === 'pwa'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2s Hold Simulator</span>
                <span className="sm:hidden">PWA</span>
              </button>
            </div>
          </div>

          {/* Per-Person Member Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {members.map((member) => {
              const isSelected = member.id === currentMember?.id;
              const medCount = medications.filter((m) => m.memberId === member.id).length;
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`group flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-2xl border text-left transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md scale-[1.01]'
                      : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${member.color} flex items-center justify-center text-base shadow-xs`}
                  >
                    {member.avatar}
                  </span>
                  <div>
                    <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      <span>{member.name}</span>
                    </div>
                    <div
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {member.role} • {medCount} {medCount === 1 ? 'med' : 'meds'}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => setMemberModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 text-xs font-semibold shrink-0 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Manage Members</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT CONTAINER --- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-5 pb-28">
        {/* MEMBER SUMMARY HERO CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentMember?.color} flex items-center justify-center text-3xl shadow-md`}
              >
                {currentMember?.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{currentMember?.name}</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentMember?.role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Today ({todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}):{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {todayStats.totalTaken} of {todayStats.totalScheduled}
                  </strong>{' '}
                  scheduled tablets taken
                </p>
              </div>
            </div>

            {/* Adherence Metrics & Add Tablet CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">
                    Today’s Intake
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                    {todayStats.percentage}%
                  </div>
                </div>

                <div className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/70 dark:border-teal-800/60">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-teal-700 dark:text-teal-400">
                    Weekly Score
                  </div>
                  <div className="text-lg font-black text-teal-700 dark:text-teal-300">{weeklyAdherence.pct}%</div>
                </div>
              </div>

              <button
                onClick={() => setMedModal({ open: true, editingMed: null })}
                className="px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Tablet</span>
              </button>
            </div>
          </div>

          {/* Quick Slot Summary Pills (☀️ Morning / 🌤️ Afternoon / 🌙 Night) */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            {Object.values(SLOTS).map((slot) => {
              const slotData = todayStats.bySlot[slot.id];
              const isAllDone = slotData.total > 0 && slotData.taken === slotData.total;
              return (
                <div
                  key={slot.id}
                  onClick={() => setQuickLogDrawer({ open: true, slot: slot.id })}
                  className={`p-2.5 sm:p-3 rounded-2xl border ${slot.bgClass} ${slot.borderClass} flex items-center justify-between cursor-pointer hover:scale-[1.01] transition`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0">{slot.emoji}</span>
                    <div className="truncate">
                      <div className={`text-xs font-bold ${slot.textClass} truncate`}>{slot.label}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {slotData.total === 0 ? 'None' : `${slotData.taken}/${slotData.total} taken`}
                      </div>
                    </div>
                  </div>
                  {isAllDone ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/70 text-slate-600 dark:text-slate-300 hidden sm:inline">
                      {reminderSettings[slot.id]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- TAB 1: TODAY'S DAILY INTAKE TRACKER --- */}
        {activeTab === 'today' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Daily Tablet Schedule</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                    Today
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tap any tablet card to mark it Taken or Skipped for {currentMember?.name}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('weekly')}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Switch to 7-Day Weekly Grid →
                </button>
              </div>
            </div>

            {Object.values(SLOTS).map((slot) => {
              const slotInfo = todayStats.bySlot[slot.id];
              return (
                <div
                  key={slot.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
                >
                  {/* Slot Header */}
                  <div
                    className={`px-4 sm:px-5 py-3.5 border-b ${slot.bgClass} ${slot.borderClass} flex items-center justify-between gap-2`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{slot.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-extrabold text-sm sm:text-base ${slot.textClass}`}>
                            {slot.label} Intake
                          </h4>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            🔔 {reminderSettings[slot.id]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {slotInfo.total === 0
                            ? 'No tablets scheduled for this time slot'
                            : `${slotInfo.taken} of ${slotInfo.total} completed today`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => triggerSlotReminder(slot.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800 hover:bg-white text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                        title={`Test ${slot.label} Reminder Alert`}
                      >
                        <Bell className="w-3.5 h-3.5 text-teal-600" />
                        <span className="hidden sm:inline">Remind</span>
                      </button>

                      {slotInfo.total > 0 && slotInfo.taken < slotInfo.total && (
                        <button
                          onClick={() => markSlotBatch(slot.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Mark All {slot.label}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tablet Cards inside Slot */}
                  <div className="p-4 sm:p-5">
                    {slotInfo.meds.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                        <span>No {slot.label.toLowerCase()} medications assigned for {currentMember?.name}.</span>
                        <button
                          onClick={() => setMedModal({ open: true, editingMed: null })}
                          className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
                        >
                          + Add one
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {slotInfo.meds.map((med) => {
                          const isTaken = med.status === 'taken';
                          const isSkipped = med.status === 'skipped';

                          return (
                            <div
                              key={`${med.id}-${slot.id}`}
                              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                isTaken
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80'
                                  : isSkipped
                                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 opacity-80'
                                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`font-bold text-sm ${
                                      isTaken
                                        ? 'line-through text-emerald-800 dark:text-emerald-300'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {med.name}
                                  </span>
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {med.dosage}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="font-medium text-teal-700 dark:text-teal-400">
                                    {med.instruction}
                                  </span>
                                  <span>•</span>
                                  <span>{med.form}</span>
                                </div>
                                {med.notes && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                                    {med.notes}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() =>
                                    toggleIntakeStatus(
                                      med.id,
                                      todayKey,
                                      slot.id,
                                      isTaken ? 'pending' : 'taken'
                                    )
                                  }
                                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                    isTaken
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                  <span>{isTaken ? 'Taken' : 'Take'}</span>
                                </button>

                                <button
                                  onClick={() =>
                                    toggleIntakeStatus(
                                      med.id,
                                      todayKey,
                                      slot.id,
                                      isSkipped ? 'pending' : 'skipped'
                                    )
                                  }
                                  className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                                    isSkipped
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 border-slate-200 dark:border-slate-700'
                                  }`}
                                  title="Mark as Skipped / Missed"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- TAB 2: INTERACTIVE 7-DAY WEEKLY MATRIX VIEW --- */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            {/* Week Header & Navigation */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Weekly Tablet Intake Matrix
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                    {currentMember?.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tap any ☀️ Morning, 🌤️ Afternoon, or 🌙 Night slot cell to cycle:{' '}
                  <span className="text-emerald-600 font-semibold">Taken (✓)</span> →{' '}
                  <span className="text-rose-600 font-semibold">Skipped (✕)</span> →{' '}
                  <span className="text-slate-500 font-semibold">Pending</span>.
                </p>
              </div>

              {/* Week Selector Controls */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWeekOffset(0)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {weekOffset === 0
                    ? 'Current Week'
                    : `${weekDays[0].monthShort} ${weekDays[0].dayNum} - ${weekDays[6].monthShort} ${weekDays[6].dayNum}`}
                </button>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
                      <th className="text-left p-4 w-56 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Tablet & Schedule
                      </th>
                      {weekDays.map((day) => (
                        <th
                          key={day.key}
                          className={`p-2.5 text-center min-w-[82px] border-l border-slate-200/60 dark:border-slate-800 ${
                            day.isToday ? 'bg-teal-50/90 dark:bg-teal-950/40' : ''
                          }`}
                        >
                          <div
                            className={`text-[11px] font-bold uppercase ${
                              day.isToday ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            {day.dayName}
                          </div>
                          <div
                            className={`text-sm font-black mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                              day.isToday
                                ? 'bg-teal-600 text-white shadow-xs'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {day.dayNum}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {memberMedications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-sm text-slate-500">
                          No medications added for {currentMember?.name} yet. Click "Add Tablet" above to start!
                        </td>
                      </tr>
                    ) : (
                      memberMedications.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition">
                          {/* Medication Info Column */}
                          <td className="p-4 align-top">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{med.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {med.dosage} • <span className="text-teal-600 dark:text-teal-400">{med.instruction}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {med.slots.map((s) => (
                                <span
                                  key={s}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${SLOTS[s].badgeClass}`}
                                >
                                  {SLOTS[s].emoji} {SLOTS[s].label}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 7 Day Columns */}
                          {weekDays.map((day) => (
                            <td
                              key={`${med.id}_${day.key}`}
                              className={`p-2 align-middle border-l border-slate-100 dark:border-slate-800/70 ${
                                day.isToday ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                {med.slots.map((slotKey) => {
                                  const slotMeta = SLOTS[slotKey];
                                  const status = intakeLogs[`${med.id}_${day.key}_${slotKey}`] || 'pending';
                                  const isTaken = status === 'taken';
                                  const isSkipped = status === 'skipped';

                                  return (
                                    <button
                                      key={slotKey}
                                      onClick={() => toggleIntakeStatus(med.id, day.key, slotKey)}
                                      title={`${med.name} (${slotMeta.label} - ${day.dayName} ${day.monthShort} ${day.dayNum}): Status is ${status.toUpperCase()}. Click to toggle.`}
                                      className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-between gap-1 border transition-all cursor-pointer ${
                                        isTaken
                                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                          : isSkipped
                                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                          : 'bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700'
                                      }`}
                                    >
                                      <span className="text-sm leading-none">{slotMeta.emoji}</span>
                                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                                        {isTaken ? (
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : isSkipped ? (
                                          <X className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : (
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        )}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legend Footer */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block" /> Taken
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-3.5 h-3.5 rounded-md bg-rose-400 inline-block" /> Skipped / Missed
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-300 dark:bg-slate-700 inline-block" /> Pending
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>☀️ Morning</span>
                  <span>🌤️ Afternoon</span>
                  <span>🌙 Night</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: MEDICATIONS DIRECTORY (PER MEMBER) --- */}
        {activeTab === 'meds' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {currentMember?.name}’s Prescribed Tablets ({memberMedications.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage dosages, instructions, and Morning / Afternoon / Night schedules.
                </p>
              </div>
              <button
                onClick={() => setMedModal({ open: true, editingMed: null })}
                className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add New Medication
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberMedications.map((med) => (
                <div
                  key={med.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {med.form} • {med.instruction}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">{med.name}</h4>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{med.dosage}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setMedModal({ open: true, editingMed: med })}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Edit Medication"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMedications((prev) => prev.filter((m) => m.id !== med.id));
                            showToast(`Removed ${med.name}`, 'info');
                          }}
                          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                          title="Delete Medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {med.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        💡 {med.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-400">Daily Schedule:</span>
                    <div className="flex items-center gap-1.5">
                      {med.slots.map((s) => (
                        <span
                          key={s}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 ${SLOTS[s].badgeClass}`}
                        >
                          <span>{SLOTS[s].emoji}</span>
                          <span>{SLOTS[s].label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 4: REMINDERS & ICON ALERTS CONFIGURATION --- */}
        {activeTab === 'reminders' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" />
                    <span>Morning ☀️, Afternoon 🌤️ & Night 🌙 Reminders</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Configure alarm times and test live push notifications with respective slot icons.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={requestNotificationAccess}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-400 dark:text-teal-600" />
                    <span>
                      {notificationPermission === 'granted'
                        ? 'System Push Active'
                        : 'Enable Browser Notifications'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Slot Time Pickers & Instant Test Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {Object.values(SLOTS).map((slot) => {
                  const countAcrossFamily = medications.filter((m) => m.slots.includes(slot.id)).length;
                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border ${slot.bgClass} ${slot.borderClass} flex flex-col justify-between gap-4`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-3xl">{slot.emoji}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${slot.badgeClass}`}>
                            {countAcrossFamily} family meds
                          </span>
                        </div>
                        <h4 className={`text-base font-extrabold mt-2 ${slot.textClass}`}>{slot.label} Reminder</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Sends {slot.emoji} icon alert with 1-tap "Mark Taken" action.
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Alert Time:</label>
                          <input
                            type="time"
                            value={reminderSettings[slot.id]}
                            onChange={(e) =>
                              setReminderSettings((prev) => ({ ...prev, [slot.id]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          onClick={() => triggerSlotReminder(slot.id)}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Test {slot.emoji} {slot.label} Alert Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: INSTALLABLE PWA & 2-SECOND HOME SCREEN HOLD SIMULATOR --- */}
        {activeTab === 'pwa' && (
          <PwaAndLongPressSimulator
            manifestJSON={manifestJSON}
            currentMember={currentMember}
            todayStats={todayStats}
            markSlotBatch={markSlotBatch}
            openQuickDrawer={(slot) => setQuickLogDrawer({ open: true, slot })}
            deferredInstallPrompt={deferredInstallPrompt}
            showToast={showToast}
          />
        )}
      </main>

      {/* --- BOTTOM NAVIGATION BAR (MOBILE-FIRST) --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
          {[
            { id: 'today', label: 'Today', icon: CheckCircle2 },
            { id: 'weekly', label: 'Weekly Grid', icon: Calendar },
            { id: 'meds', label: 'Tablets', icon: Pill },
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'pwa', label: '2s Hold PWA', icon: Smartphone }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition cursor-pointer ${
                  active
                    ? 'text-teal-600 dark:text-teal-400 font-extrabold bg-teal-50/80 dark:bg-teal-950/50'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- MODAL 1: QUICK-MARK INTAKE DRAWER (TRIGGERED BY 2s HOME SCREEN SHORTCUT OR FAB) --- */}
      {quickLogDrawer.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-black/20">
                    Home Screen Shortcut Sheet
                  </span>
                  <h3 className="text-base font-extrabold mt-0.5">
                    Quick Mark Tablet Intake ({currentMember?.name})
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setQuickLogDrawer({ open: false, slot: 'all' })}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter by Slot inside Quick Drawer */}
            <div className="px-5 pt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['all', 'morning', 'afternoon', 'night'].map((sKey) => (
                <button
                  key={sKey}
                  onClick={() => setQuickLogDrawer({ open: true, slot: sKey })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize shrink-0 transition cursor-pointer ${
                    quickLogDrawer.slot === sKey
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sKey === 'all' ? 'All Slots' : `${SLOTS[sKey].emoji} ${SLOTS[sKey].label}`}
                </button>
              ))}
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {Object.values(SLOTS)
                .filter((s) => quickLogDrawer.slot === 'all' || quickLogDrawer.slot === s.id)
                .map((slot) => {
                  const slotMeds = todayStats.bySlot[slot.id].meds;
                  if (slotMeds.length === 0) return null;
                  return (
                    <div key={slot.id} className="space-y-2">
                      <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{slot.emoji}</span>
                        <span>{slot.label}</span>
                      </div>
                      {slotMeds.map((med) => {
                        const isTaken = med.status === 'taken';
                        return (
                          <div
                            key={`${med.id}_${slot.id}`}
                            onClick={() =>
                              toggleIntakeStatus(med.id, todayKey, slot.id, isTaken ? 'pending' : 'taken')
                            }
                            className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                              isTaken
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-sm">{med.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {med.dosage} • {med.instruction}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                                isTaken
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              {isTaken ? 'Taken' : 'Mark Taken'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  markSlotBatch(quickLogDrawer.slot);
                  setQuickLogDrawer({ open: false, slot: 'all' });
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Mark All Shown as Taken</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD / EDIT MEDICATION --- */}
      {medModal.open && (
        <MedicationFormModal
          member={currentMember}
          editingMed={medModal.editingMed}
          onClose={() => setMedModal({ open: false, editingMed: null })}
          onSave={(medData) => {
            if (medModal.editingMed) {
              setMedications((prev) =>
                prev.map((m) => (m.id === medModal.editingMed.id ? { ...m, ...medData } : m))
              );
              showToast(`Updated ${medData.name}!`);
            } else {
              const newMed = {
                ...medData,
                id: `med-${Date.now()}`,
                memberId: currentMember.id
              };
              setMedications((prev) => [...prev, newMed]);
              showToast(`Added ${medData.name} for ${currentMember.name}!`);
            }
            setMedModal({ open: false, editingMed: null });
          }}
        />
      )}

      {/* --- MODAL 3: MANAGE FAMILY MEMBERS --- */}
      {memberModalOpen && (
        <MemberManagerModal
          members={members}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
          onAddMember={(newMember) => {
            const created = { ...newMember, id: `mem-${Date.now()}` };
            setMembers((prev) => [...prev, created]);
            setSelectedMemberId(created.id);
            showToast(`Added family member ${created.name}!`);
          }}
          onDeleteMember={(id) => {
            if (members.length <= 1) {
              showToast('At least one member must remain.', 'info');
              return;
            }
            const filtered = members.filter((m) => m.id !== id);
            setMembers(filtered);
            if (selectedMemberId === id) {
              setSelectedMemberId(filtered[0].id);
            }
            showToast('Member removed.', 'info');
          }}
          onClose={() => setMemberModalOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: INTERACTIVE 2-SECOND HOME SCREEN HOLD SIMULATOR & PWA EXPORT
// ============================================================================
function PwaAndLongPressSimulator({
  manifestJSON,
  currentMember,
  todayStats,
  markSlotBatch,
  openQuickDrawer,
  deferredInstallPrompt,
  showToast
}) {
  const [isPressing, setIsPressing] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100 over 2000ms
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);
  const [copiedFile, setCopiedFile] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const HOLD_DURATION_MS = 1800; // ~2 seconds hold

  const startHold = (e) => {
    e.preventDefault();
    if (shortcutMenuOpen) return;
    setIsPressing(true);
    setHoldProgress(0);
    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setHoldProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        setIsPressing(false);
        setHoldProgress(100);
        setShortcutMenuOpen(true);
        playNotificationChime();
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setIsPressing(false);
    setHoldProgress(0);
  };

  const serviceWorkerCode = `// sw.js - MedTrack Offline & Notification Service Worker
const CACHE_NAME = 'medtrack-pwa-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/?action=quick-log&slot=all'));
});`;

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Explanation Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-teal-500/30 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
              Native PWA + App Shortcuts Spec
            </span>
            <h3 className="text-xl font-black mt-2">
              2-Second Home Screen Long-Press Quick Intake
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              MedTrack injects a Web App Manifest with the <code className="text-amber-300">shortcuts</code> array.
              When installed on Android/iOS/Desktop, holding the MedTrack icon on your phone’s Home Screen for 2 seconds
              pops up direct actions to mark <strong>☀️ Morning</strong>, <strong>🌤️ Afternoon</strong>, or{' '}
              <strong>🌙 Night</strong> tablets immediately.
            </p>
          </div>

          {deferredInstallPrompt && (
            <button
              onClick={async () => {
                deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
              }}
              className="px-4 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install App Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Interactive Phone Home Screen Simulator + Manifest Code Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Phone Mockup */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Interactive Home Screen Simulator
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Press & hold the <strong>MedTrack</strong> icon below for 2 seconds!
              </p>
            </div>
            {shortcutMenuOpen && (
              <button
                onClick={() => setShortcutMenuOpen(false)}
                className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
              >
                Reset Screen
              </button>
            )}
          </div>

          {/* Phone Bezel */}
          <div className="w-full max-w-[320px] h-[500px] rounded-[42px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-4 border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-[11px] font-bold text-white/80 px-2 pt-1">
              <span>9:41</span>
              <div className="w-16 h-4 rounded-full bg-black/60" />
              <span>5G • 100%</span>
            </div>

            {/* Wallpaper & App Icons Grid */}
            <div className="flex-1 pt-8 px-2 relative">
              {/* Backdrop blur when shortcut menu is open */}
              {shortcutMenuOpen && (
                <div
                  onClick={() => setShortcutMenuOpen(false)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-xs z-10 rounded-2xl transition-opacity"
                />
              )}

              {/* 2-SECOND LONG-PRESS CONTEXT MENU POPUP */}
              {shortcutMenuOpen && (
                <div className="absolute left-3 right-3 top-6 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-white/20 animate-fadeIn">
                  <div className="flex items-center justify-between px-2 pb-2 mb-1.5 border-b border-slate-200/70 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      ⚡ {currentMember?.name} Quick Intake
                    </span>
                    <span className="text-[10px] text-slate-400">OS Shortcut</span>
                  </div>

                  <div className="space-y-1.5">
                    {Object.values(SLOTS).map((slot) => {
                      const st = todayStats.bySlot[slot.id];
                      const done = st.total > 0 && st.taken === st.total;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            markSlotBatch(slot.id);
                            setShortcutMenuOpen(false);
                          }}
                          className="w-full px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{slot.emoji}</span>
                            <div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600">
                                Mark {slot.label} Taken
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {st.total === 0 ? 'No tablets' : `${st.taken}/${st.total} completed today`}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              done
                                ? 'bg-emerald-500 text-white'
                                : 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setShortcutMenuOpen(false);
                        openQuickDrawer('all');
                      }}
                      className="w-full px-3 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer mt-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Open Full Quick-Log Sheet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Home Screen App Icons */}
              <div className="grid grid-cols-4 gap-4 items-start pt-4">
                {/* MEDTRACK PWA ICON (INTERACTIVE 2s HOLD TARGET) */}
                <div className="flex flex-col items-center relative z-20">
                  <button
                    onMouseDown={startHold}
                    onMouseUp={cancelHold}
                    onMouseLeave={cancelHold}
                    onTouchStart={startHold}
                    onTouchEnd={cancelHold}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-lg relative transition-transform cursor-pointer ${
                      isPressing ? 'scale-90 ring-4 ring-teal-300/60' : 'hover:scale-105'
                    }`}
                  >
                    <Pill className="w-7 h-7" />
                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                      {Math.max(0, todayStats.totalScheduled - todayStats.totalTaken)}
                    </span>
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1.5 drop-shadow">MedTrack</span>

                  {/* Hold Progress Ring / Bar */}
                  {isPressing && (
                    <div className="mt-1.5 w-16 bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full transition-all duration-75"
                        style={{ width: `${holdProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Dummy OS Icons for Realism */}
                {[
                  { name: 'Calendar', bg: 'from-rose-400 to-red-600', emoji: '📅' },
                  { name: 'Health', bg: 'from-pink-400 to-rose-500', emoji: '❤️' },
                  { name: 'Clock', bg: 'from-slate-600 to-slate-800', emoji: '⏰' }
                ].map((app) => (
                  <div key={app.name} className="flex flex-col items-center opacity-50">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.bg} flex items-center justify-center text-2xl shadow`}
                    >
                      {app.emoji}
                    </div>
                    <span className="text-[11px] font-medium text-white/80 mt-1.5">{app.name}</span>
                  </div>
                ))}
              </div>

              {/* Instruction Callout inside Phone Screen */}
              {!shortcutMenuOpen && (
                <div className="mt-10 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center text-white">
                  <p className="text-xs font-bold text-amber-300">
                    {isPressing
                      ? `Keep holding... ${Math.ceil(((100 - holdProgress) / 100) * 2)}s`
                      : '👆 Press & Hold "MedTrack" for 2 Seconds'}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Simulates long-pressing the installed PWA icon on your phone’s Home Screen.
                  </p>
                </div>
              )}
            </div>

            {/* Phone Dock */}
            <div className="h-14 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-around px-4">
              <span className="text-lg opacity-70">📞</span>
              <span className="text-lg opacity-70">💬</span>
              <span className="text-lg opacity-70">🌐</span>
              <span className="text-lg opacity-70">📷</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Production `manifest.json` & `sw.js` Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>manifest.json (With 2s Hold Shortcuts)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Already injected into this page’s <code className="text-teal-600">&lt;head&gt;</code> dynamically.
                </p>
              </div>
              <button
                onClick={() => copyText(JSON.stringify(manifestJSON, null, 2), 'manifest.json')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFile === 'manifest.json' ? 'Copied!' : 'Copy Manifest'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950 text-teal-300 text-[11px] font-mono overflow-x-auto max-h-60">
              {JSON.stringify(manifestJSON, null, 2)}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  sw.js (Offline & Notification Click Worker)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Handles offline caching and opens the Quick-Log sheet when a reminder is tapped.
                </p>
              </div>
              <button
                onClick={() => copyText(serviceWorkerCode, 'sw.js')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFile === 'sw.js' ? 'Copied!' : 'Copy Service Worker'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-950 text-sky-300 text-[11px] font-mono overflow-x-auto max-h-48">
              {serviceWorkerCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: ADD / EDIT MEDICATION MODAL
// ============================================================================
function MedicationFormModal({ member, editingMed, onClose, onSave }) {
  const [name, setName] = useState(editingMed?.name || '');
  const [dosage, setDosage] = useState(editingMed?.dosage || '1 Tablet (500mg)');
  const [form, setForm] = useState(editingMed?.form || 'Tablet');
  const [instruction, setInstruction] = useState(editingMed?.instruction || 'After Food');
  const [slots, setSlots] = useState(editingMed?.slots || ['morning']);
  const [notes, setNotes] = useState(editingMed?.notes || '');
  const [error, setError] = useState('');

  const toggleSlot = (slotId) => {
    setSlots((prev) => (prev.includes(slotId) ? prev.filter((s) => s !== slotId) : [...prev, slotId]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a tablet or medication name.');
      return;
    }
    if (slots.length === 0) {
      setError('Select at least one schedule slot (Morning, Afternoon, or Night).');
      return;
    }
    onSave({
      name: name.trim(),
      dosage: dosage.trim() || '1 Tablet',
      form,
      instruction,
      slots,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {editingMed ? 'Edit Tablet Schedule' : `Add Tablet for ${member?.name}`}
            </h3>
            <p className="text-xs text-slate-500">Choose dosage and Morning / Afternoon / Night icons</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Medication / Tablet Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Paracetamol, Vitamin B12, Metformin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
              <input
                type="text"
                placeholder="e.g., 500mg (1 Tab)"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Form</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Drops</option>
                <option>Injection</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Food Timing Instruction
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['After Food', 'Before Food', 'Empty Stomach', 'With Water', 'Before Sleep', 'With Food'].map((inst) => (
                <button
                  type="button"
                  key={inst}
                  onClick={() => setInstruction(inst)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    instruction === inst
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Slots (☀️ / 🌤️ / 🌙) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Time of Day Schedule (Select one or more) *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {Object.values(SLOTS).map((slot) => {
                const active = slots.includes(slot.id);
                return (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-2xl">{slot.emoji}</div>
                    <div className="text-xs font-extrabold mt-1">{slot.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Avoid dairy within 1 hour"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
            >
              {editingMed ? 'Save Changes' : 'Add Tablet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: ADD / MANAGE FAMILY MEMBERS MODAL
// ============================================================================
function MemberManagerModal({ members, selectedMemberId, onSelectMember, onAddMember, onDeleteMember, onClose }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Family');
  const [avatar, setAvatar] = useState('🧑');
  const [color, setColor] = useState('from-teal-500 to-emerald-600');

  const AVATARS = ['🧑‍💻', '👩‍🦳', '👨‍🦳', '👩', '👨', '👧', '👦', '👵', '👴'];
  const COLORS = [
    'from-teal-500 to-emerald-600',
    'from-rose-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600'
  ];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddMember({ name: name.trim(), role: role.trim() || 'Member', avatar, color });
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Family Members</h3>
            <p className="text-xs text-slate-500">Add or switch between people to track their tablets</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Existing Members List */}
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
              >
                <div
                  onClick={() => {
                    onSelectMember(m.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-xl`}
                  >
                    {m.avatar}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.role}</div>
                  </div>
                </div>
                {members.length > 1 && (
                  <button
                    onClick={() => onDeleteMember(m.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add New Member Form */}
          <form onSubmit={handleAdd} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              + Add Another Person
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Name (e.g. Priya)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
              <input
                type="text"
                placeholder="Role (e.g. Sister, Grandma)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border cursor-pointer ${
                    avatar === av
                      ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 scale-105'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              Add Person
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}