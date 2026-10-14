import React from 'react';
import { Plus, UserMinus, Edit2, Trash2, Check, X, Repeat } from 'lucide-react';
import { SLOTS, FOOD_OPTIONS } from '../constants';
import { isMedScheduledForDate, getScheduleBadgeText } from '../utils/schedule';

export default function TodayView({
  activeMember,
  memberMeds,
  todayKey,
  appData,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteMember,
  onDeleteMed,
  onSetStatus,
  onMarkBatch
}) {
  if (!activeMember) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
            Today • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <h2 className="text-lg font-bold mt-0.5">
            {activeMember.avatar} {activeMember.name}’s Tablets
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {appData.members.length > 1 && (
            <button
              onClick={() => onDeleteMember(activeMember.id, activeMember.name)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium px-3 py-2.5 rounded-xl transition cursor-pointer"
            >
              <UserMinus className="w-4 h-4" />
              <span className="hidden sm:inline">Delete Member</span>
            </button>
          )}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tablet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {SLOTS.map((slot) => {
          const slotMeds = memberMeds.filter(
            (m) => m.slots.includes(slot.id) && isMedScheduledForDate(m, todayKey)
          );
          const offTodayCount = memberMeds.filter(
            (m) => m.slots.includes(slot.id) && !isMedScheduledForDate(m, todayKey)
          ).length;

          return (
            <div key={slot.id} className={'rounded-2xl border bg-slate-900/70 overflow-hidden flex flex-col ' + slot.border}>
              <div className={'px-4 py-3 flex items-center justify-between border-b border-slate-800/80 ' + slot.bg}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{slot.emoji}</span>
                  <div>
                    <h3 className={'font-bold text-sm ' + slot.color}>{slot.label}</h3>
                    <p className="text-[11px] text-slate-400">
                      ⏰ {appData.reminders[slot.id]?.time}
                      {offTodayCount > 0 ? ' • (' + offTodayCount + ' off today)' : ''}
                    </p>
                  </div>
                </div>
                {slotMeds.length > 0 && (
                  <button
                    onClick={() => onMarkBatch(slot.id, 'taken')}
                    className="text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 font-medium transition cursor-pointer"
                  >
                    ✓ Mark All
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800/60">
                {slotMeds.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 px-4 text-center">
                    No {slot.label.toLowerCase()} tablets due today.
                  </p>
                ) : (
                  slotMeds.map((med) => {
                    const status = appData.logs[todayKey]?.[med.id + '_' + slot.id] || 'pending';
                    const foodMeta = FOOD_OPTIONS.find((f) => f.id === (med.foodTiming || 'after')) || FOOD_OPTIONS[1];

                    return (
                      <div key={med.id} className="p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm text-white flex flex-wrap items-center gap-1.5">
                              <span>{med.name}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                                {med.dosage}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className={'text-[10px] px-2 py-0.5 rounded-full border font-medium ' + foodMeta.badgeClass}>
                                {foodMeta.emoji} {foodMeta.label}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 inline-flex items-center gap-1">
                                <Repeat className="w-2.5 h-2.5 text-indigo-400" />
                                {getScheduleBadgeText(med)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onOpenEditModal(med)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteMed(med.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            Status:{' '}
                            <strong
                              className={
                                status === 'taken' ? 'text-emerald-400' : status === 'skipped' ? 'text-rose-400' : 'text-amber-400'
                              }
                            >
                              {status.toUpperCase()}
                            </strong>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onSetStatus(todayKey, med.id, slot.id, 'taken')}
                              className={
                                'px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ' +
                                (status === 'taken' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200 hover:bg-slate-700')
                              }
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Take</span>
                            </button>
                            <button
                              onClick={() => onSetStatus(todayKey, med.id, slot.id, 'skipped')}
                              className={
                                'p-1 rounded-lg text-xs transition cursor-pointer ' +
                                (status === 'skipped' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')
                              }
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
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
    </div>
  );
}