import React from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { SLOTS, FOOD_OPTIONS } from '../constants';
import { isMedScheduledForDate, getScheduleBadgeText } from '../utils/schedule';

export default function WeeklyView({
  activeMember,
  memberMeds,
  weekDays,
  appData,
  onOpenAddModal,
  onOpenEditModal,
  onCycleStatus
}) {
  if (!activeMember) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">
            Weekly Schedule View — {activeMember.avatar} {activeMember.name}
          </h2>
          <p className="text-xs text-slate-400">
            Tap any active ☀️, 🌤️, or 🌙 slot to mark Taken (✓) or Skipped (✕). Click ✏️ to edit a tablet.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Tablet</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="py-3 pr-3 font-semibold">Tablet / Food / Frequency</th>
              {weekDays.map((d) => (
                <th
                  key={d.key}
                  className={'py-2 px-2 text-center rounded-t-lg ' + (d.isToday ? 'bg-indigo-500/10 text-indigo-300 font-bold' : '')}
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
                    <div className="text-slate-100 flex items-center gap-2">
                      <span>{med.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({med.dosage})</span>
                      <button
                        onClick={() => onOpenEditModal(med)}
                        className="text-slate-400 hover:text-indigo-400 p-1 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={'text-[10px] px-1.5 py-0.5 rounded border ' + foodMeta.badgeClass}>
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
                      <td key={d.key} className={'py-2.5 px-1.5 text-center ' + (d.isToday ? 'bg-indigo-500/5' : '')}>
                        {!scheduled ? (
                          <span className="inline-block text-[11px] text-slate-600 select-none">—</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {med.slots.map((slotId) => {
                              const slotMeta = SLOTS.find((s) => s.id === slotId);
                              const st = appData.logs[d.key]?.[med.id + '_' + slotId] || 'pending';
                              return (
                                <button
                                  key={slotId}
                                  onClick={() => onCycleStatus(d.key, med.id, slotId)}
                                  className={
                                    'w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[10px] border transition cursor-pointer ' +
                                    (st === 'taken'
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                                      : st === 'skipped'
                                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                                      : 'bg-slate-800/80 border-slate-700 text-slate-400')
                                  }
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
  );
}