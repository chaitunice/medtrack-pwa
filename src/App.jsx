import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { DEFAULT_FILENAME, TODAY_STR, SESSION_BUFFER_KEY } from './constants';
import { loadInitialBuffer, getRememberedFileHandle, rememberFileHandle, clearRememberedFileHandle } from './utils/storage';
import { getCurrentWeekDays, isMedScheduledForDate } from './utils/schedule';

import Header from './components/Header';
import Navigation from './components/Navigation';
import TodayView from './components/TodayView';
import WeeklyView from './components/WeeklyView';
import RemindersView from './components/RemindersView';
import SimulatorView from './components/SimulatorView';
import FileStorageView from './components/FileStorageView';
import AddMemberModal from './components/AddMemberModal';
import MedicationModal from './components/MedicationModal';

export default function App() {
  const [appData, setAppData] = useState(loadInitialBuffer);
  const [activeMemberId, setActiveMemberId] = useState(() => loadInitialBuffer().members[0]?.id || 'm1');
  const [activeTab, setActiveTab] = useState('today');

  const [fileHandle, setFileHandle] = useState(null);
  const [linkedFileName, setLinkedFileName] = useState(() => localStorage.getItem('medtrack_last_filename') || DEFAULT_FILENAME);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const [showAddMember, setShowAddMember] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const [isHoldingIcon, setIsHoldingIcon] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const holdTimerRef = useRef(null);

  const weekDays = getCurrentWeekDays();
  const activeMember = appData.members.find((m) => m.id === activeMemberId) || appData.members[0] || null;
  const memberMeds = appData.medications.filter((m) => m.memberId === activeMember?.id);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  useEffect(() => {
    async function restoreLastFile() {
      const savedHandle = await getRememberedFileHandle();
      if (savedHandle) {
        setFileHandle(savedHandle);
        setLinkedFileName(savedHandle.name);
        localStorage.setItem('medtrack_last_filename', savedHandle.name);
      }
    }
    restoreLastFile();
  }, []);

  const verifyAndWriteToHandle = async (handle, dataObj) => {
    try {
      if (handle.queryPermission) {
        let perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') perm = await handle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') return false;
      }
      await handle.getFile();
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(dataObj, null, 2));
      await writable.close();
      setUnsavedChanges(false);
      return true;
    } catch (err) {
      setFileHandle(null);
      await clearRememberedFileHandle();
      return false;
    }
  };

  const askWhereToSaveAndWrite = async (dataObj) => {
    if ('showSaveFilePicker' in window) {
      try {
        const newHandle = await window.showSaveFilePicker({
          suggestedName: linkedFileName || DEFAULT_FILENAME,
          types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }]
        });
        setFileHandle(newHandle);
        setLinkedFileName(newHandle.name);
        localStorage.setItem('medtrack_last_filename', newHandle.name);
        await rememberFileHandle(newHandle);

        const writable = await newHandle.createWritable();
        await writable.write(JSON.stringify(dataObj, null, 2));
        await writable.close();
        setUnsavedChanges(false);
        showToast('💾 Saved to ' + newHandle.name);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
      }
    }

    const blob = new Blob([JSON.stringify(dataObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = linkedFileName || DEFAULT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
    setUnsavedChanges(false);
    showToast('💾 Downloaded ' + (linkedFileName || DEFAULT_FILENAME));
    return true;
  };

  const handleSmartSaveFile = async () => {
    if (fileHandle) {
      const ok = await verifyAndWriteToHandle(fileHandle, appData);
      if (ok) {
        showToast('💾 Saved directly to ' + linkedFileName);
        return;
      }
    }
    await askWhereToSaveAndWrite(appData);
  };

  const updateDataAndSyncFile = (updaterFn) => {
    setAppData((prev) => {
      const next = typeof updaterFn === 'function' ? updaterFn(prev) : updaterFn;
      const updatedPayload = { ...next, updatedAt: new Date().toISOString() };
      localStorage.setItem(SESSION_BUFFER_KEY, JSON.stringify(updatedPayload));

      if (fileHandle) {
        verifyAndWriteToHandle(fileHandle, updatedPayload).then((ok) => {
          if (!ok) setUnsavedChanges(true);
        });
      } else {
        setUnsavedChanges(true);
      }
      return updatedPayload;
    });
  };

  const handleOpenFile = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });
        const file = await handle.getFile();
        const parsed = JSON.parse(await file.text());
        if (parsed.members && parsed.medications) {
          setAppData(parsed);
          localStorage.setItem(SESSION_BUFFER_KEY, JSON.stringify(parsed));
          setActiveMemberId(parsed.members[0]?.id || 'm1');
          setFileHandle(handle);
          setLinkedFileName(handle.name);
          localStorage.setItem('medtrack_last_filename', handle.name);
          await rememberFileHandle(handle);
          setUnsavedChanges(false);
          showToast('📂 Opened & remembered ' + handle.name);
        }
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  };

  const markSlotBatch = (slotId, status = 'taken') => {
    const slotMeds = memberMeds.filter(
      (m) => m.slots.includes(slotId) && isMedScheduledForDate(m, TODAY_STR)
    );
    if (slotMeds.length === 0) {
      showToast('No tablets scheduled today in this slot.');
      return;
    }
    updateDataAndSyncFile((prev) => {
      const dayLogs = { ...(prev.logs[TODAY_STR] || {}) };
      slotMeds.forEach((m) => {
        dayLogs[m.id + '_' + slotId] = status;
      });
      return { ...prev, logs: { ...prev.logs, [TODAY_STR]: dayLogs } };
    });
    showToast('Marked slot as ' + status + '!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const parsed = JSON.parse(ev.target.result);
            setAppData(parsed);
            setLinkedFileName(file.name);
            showToast('Loaded ' + file.name);
          };
          reader.readAsText(file);
        }}
        className="hidden"
      />

      <Header
        appData={appData}
        activeMemberId={activeMemberId}
        setActiveMemberId={setActiveMemberId}
        linkedFileName={linkedFileName}
        fileHandle={fileHandle}
        unsavedChanges={unsavedChanges}
        onSave={handleSmartSaveFile}
        onOpen={handleOpenFile}
        onAddMember={() => setShowAddMember(true)}
        onDeleteMember={(id, name) => {
          if (appData.members.length <= 1) return showToast('At least one member required.');
          if (!window.confirm('Delete ' + name + '?')) return;
          updateDataAndSyncFile((prev) => {
            const remainingMembers = prev.members.filter((m) => m.id !== id);
            return {
              ...prev,
              members: remainingMembers,
              medications: prev.medications.filter((m) => m.memberId !== id)
            };
          });
          showToast('Deleted ' + name);
        }}
      />

      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-6">
        {activeTab === 'today' && (
          <TodayView
            activeMember={activeMember}
            memberMeds={memberMeds}
            todayKey={TODAY_STR}
            appData={appData}
            onOpenAddModal={() => { setEditingMed(null); setShowMedModal(true); }}
            onOpenEditModal={(med) => { setEditingMed(med); setShowMedModal(true); }}
            onDeleteMember={(id, name) => {
              updateDataAndSyncFile((prev) => ({
                ...prev,
                members: prev.members.filter((m) => m.id !== id),
                medications: prev.medications.filter((m) => m.memberId !== id)
              }));
            }}
            onDeleteMed={(medId) => {
              updateDataAndSyncFile((prev) => ({
                ...prev,
                medications: prev.medications.filter((m) => m.id !== medId)
              }));
              showToast('Tablet removed');
            }}
            onSetStatus={(dateKey, medId, slotId, status) => {
              updateDataAndSyncFile((prev) => {
                const dayLogs = { ...(prev.logs[dateKey] || {}) };
                const key = medId + '_' + slotId;
                if (dayLogs[key] === status) delete dayLogs[key];
                else dayLogs[key] = status;
                return { ...prev, logs: { ...prev.logs, [dateKey]: dayLogs } };
              });
            }}
            onMarkBatch={markSlotBatch}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyView
            activeMember={activeMember}
            memberMeds={memberMeds}
            weekDays={weekDays}
            appData={appData}
            onOpenAddModal={() => { setEditingMed(null); setShowMedModal(true); }}
            onOpenEditModal={(med) => { setEditingMed(med); setShowMedModal(true); }}
            onCycleStatus={(dateKey, medId, slotId) => {
              const current = appData.logs[dateKey]?.[medId + '_' + slotId] || 'pending';
              const next = current === 'pending' ? 'taken' : current === 'taken' ? 'skipped' : 'pending';
              updateDataAndSyncFile((prev) => {
                const dayLogs = { ...(prev.logs[dateKey] || {}) };
                dayLogs[medId + '_' + slotId] = next;
                return { ...prev, logs: { ...prev.logs, [dateKey]: dayLogs } };
              });
            }}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersView
            appData={appData}
            memberMeds={memberMeds}
            todayKey={TODAY_STR}
            activeMember={activeMember}
            onUpdateReminder={(slotId, field, val) => {
              updateDataAndSyncFile((prev) => ({
                ...prev,
                reminders: {
                  ...prev.reminders,
                  [slotId]: { ...prev.reminders[slotId], [field]: val }
                }
              }));
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorView
            activeMember={activeMember}
            isHoldingIcon={isHoldingIcon}
            holdProgress={holdProgress}
            showShortcutPopup={showShortcutPopup}
            onStartHold={() => {
              setIsHoldingIcon(true);
              setHoldProgress(0);
              setShowShortcutPopup(false);
              const start = Date.now();
              holdTimerRef.current = setInterval(() => {
                const elapsed = Date.now() - start;
                const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
                setHoldProgress(pct);
                if (elapsed >= 2000) {
                  clearInterval(holdTimerRef.current);
                  setIsHoldingIcon(false);
                  setShowShortcutPopup(true);
                }
              }, 50);
            }}
            onEndHold={() => {
              clearInterval(holdTimerRef.current);
              setIsHoldingIcon(false);
              if (holdProgress < 100) setHoldProgress(0);
            }}
            onClosePopup={() => setShowShortcutPopup(false)}
            onMarkBatch={(slotId) => {
              markSlotBatch(slotId, 'taken');
              setShowShortcutPopup(false);
            }}
          />
        )}

        {activeTab === 'file' && (
          <FileStorageView
            linkedFileName={linkedFileName}
            appData={appData}
            onSave={handleSmartSaveFile}
            onSaveAs={() => askWhereToSaveAndWrite(appData)}
            onOpen={handleOpenFile}
          />
        )}
      </main>

      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onAdd={(name, avatar) => {
            const newMember = { id: 'm_' + Date.now(), name, avatar };
            updateDataAndSyncFile((prev) => ({ ...prev, members: [...prev.members, newMember] }));
            setActiveMemberId(newMember.id);
            setShowAddMember(false);
            showToast('Added member ' + name);
          }}
        />
      )}

      {showMedModal && (
        <MedicationModal
          activeMember={activeMember}
          editingMed={editingMed}
          onClose={() => { setShowMedModal(false); setEditingMed(null); }}
          onSave={(medPayload) => {
            updateDataAndSyncFile((prev) => {
              if (editingMed) {
                return {
                  ...prev,
                  medications: prev.medications.map((m) => (m.id === editingMed.id ? medPayload : m))
                };
              }
              return { ...prev, medications: [...prev.medications, medPayload] };
            });
            setShowMedModal(false);
            setEditingMed(null);
            showToast('Saved tablet successfully!');
          }}
        />
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}