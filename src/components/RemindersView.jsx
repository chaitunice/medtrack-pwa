import React from 'react';
import { Bell } from 'lucide-react';
import { SLOTS, FOOD_OPTIONS } from '../constants';
import { isMedScheduledForDate } from '../utils/schedule';

export default function RemindersView({
  appData,
  memberMeds,
  todayKey,
  activeMember,
  onUpdateReminder,
  onShowToast
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <h2 className="text-base font-bold flex items-center gap-2">
        <Bell className="w-4 h-4 text-indigo-400" />
        <span>Morning / Afternoon / Evening Reminders</span>
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {SLOTS.map((slot) => {
          const rem = appData.reminders[slot.id];
          const dueMeds = memberMeds.filter(
            (m) => m.slots.includes(slot.id) && isMedScheduledForDate(m, todayKey)
          );
          return (
            <div key={slot.id} className={'p-4 rounded-xl border bg-slate-950/60 space-y-3 ' + slot.border}>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold flex items-center gap-2">
                  <span>{slot.emoji}</span>
                  <span className={slot.color}>{slot.label}</span>
                </span>
                <input
                  type="checkbox"
                  checked={rem?.enabled ?? true}
                  onChange={(e) => onUpdateReminder(slot.id, 'enabled', e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
              </div>
              <input
                type="time"
                value={rem?.time || '08:00'}
                onChange={(e) => onUpdateReminder(slot.id, 'time', e.target.value)}
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
                  onShowToast(slot.emoji + ' Reminder: Take ' + (activeMember?.name || '') + '\'s ' + slot.label + ' tablets!')
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
  );
}