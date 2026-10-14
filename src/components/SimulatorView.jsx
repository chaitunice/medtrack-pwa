import React from 'react';
import { Pill } from 'lucide-react';
import { SLOTS } from '../constants';

export default function SimulatorView({
  activeMember,
  isHoldingIcon,
  holdProgress,
  showShortcutPopup,
  onStartHold,
  onEndHold,
  onClosePopup,
  onMarkBatch
}) {
  return (
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
              <button onClick={onClosePopup}>✕</button>
            </div>
            {SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onMarkBatch(slot.id, 'taken')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-600/20 text-xs font-medium text-slate-100 cursor-pointer"
              >
                <span className="text-base">{slot.emoji}</span>
                <span>Mark {slot.label} Taken</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <button
            onMouseDown={onStartHold}
            onMouseUp={onEndHold}
            onMouseLeave={onEndHold}
            onTouchStart={onStartHold}
            onTouchEnd={onEndHold}
            className={
              'w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl transition-transform cursor-pointer ' +
              (isHoldingIcon ? 'scale-90 ring-4 ring-indigo-400/50' : '')
            }
          >
            <Pill className="w-8 h-8 text-white" />
          </button>
          <span className="text-xs font-medium text-slate-200">MedTrack</span>
          {isHoldingIcon && (
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: holdProgress + '%' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}