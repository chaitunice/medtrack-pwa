import React, { useState, useEffect } from 'react';
import { Utensils, CalendarClock } from 'lucide-react';
import { SLOTS, FOOD_OPTIONS, WEEKDAY_LABELS, TODAY_STR } from '../constants';

export default function MedicationModal({ activeMember, editingMed, onClose, onSave }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [medSlots, setMedSlots] = useState(['morning']);
  const [food, setFood] = useState('after');
  const [freqType, setFreqType] = useState('daily');
  const [weekDays, setWeekDays] = useState([1, 3, 5]);
  const [interval, setInterval] = useState(2);
  const [startDate, setStartDate] = useState(TODAY_STR);
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (editingMed) {
      setName(editingMed.name || '');
      setDosage(editingMed.dosage || '');
      setMedSlots(editingMed.slots || ['morning']);
      setFood(editingMed.foodTiming || 'after');
      setFreqType(editingMed.frequencyType || 'daily');
      setWeekDays(editingMed.weekDays || [1, 3, 5]);
      setInterval(editingMed.intervalDays || 2);
      setStartDate(editingMed.startDate || TODAY_STR);
      setEndDate(editingMed.endDate || '');
    }
  }, [editingMed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || medSlots.length === 0) return;

    onSave({
      id: editingMed ? editingMed.id : 'med_' + Date.now(),
      memberId: activeMember.id,
      name: name.trim(),
      dosage: dosage.trim() || '1 Tablet',
      slots: medSlots,
      foodTiming: food,
      frequencyType: freqType,
      weekDays: freqType === 'weekly' ? weekDays : [0, 1, 2, 3, 4, 5, 6],
      intervalDays: freqType === 'schedule' ? Math.max(1, parseInt(interval, 10) || 1) : 1,
      startDate: startDate || TODAY_STR,
      endDate: freqType === 'schedule' ? endDate : ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base">
            {editingMed ? '✏️ Edit Tablet Details' : 'Add Tablet for ' + activeMember?.avatar + ' ' + activeMember?.name}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <input
            type="text"
            placeholder="Tablet Name (e.g., Dolo 650)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white"
            required
          />
          <input
            type="text"
            placeholder="Dosage (500mg)"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Food Timing (Before or After Food)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FOOD_OPTIONS.map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setFood(f.id)}
                className={
                  'py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ' +
                  (food === f.id ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-800 bg-slate-950 text-slate-400')
                }
              >
                <span className="text-sm">{f.emoji}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Time of Day (Morning / Afternoon / Evening)</label>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => {
              const selected = medSlots.includes(s.id);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() =>
                    setMedSlots((prev) => (prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]))
                  }
                  className={
                    'py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 cursor-pointer ' +
                    (selected ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-slate-800 bg-slate-950 text-slate-400')
                  }
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                onClick={() => setFreqType(tab.id)}
                className={
                  'py-2 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ' +
                  (freqType === tab.id ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400')
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {freqType === 'weekly' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400">Select which days of the week:</div>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAY_LABELS.map((w) => {
                  const active = weekDays.includes(w.day);
                  return (
                    <button
                      type="button"
                      key={w.day}
                      onClick={() =>
                        setWeekDays((prev) => (prev.includes(w.day) ? prev.filter((d) => d !== w.day) : [...prev, w.day]))
                      }
                      className={
                        'py-2 rounded-lg text-xs font-bold border transition cursor-pointer ' +
                        (active ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400')
                      }
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {freqType === 'schedule' && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-300">Repeat every:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
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
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer">
            {editingMed ? 'Update Tablet' : 'Save Tablet'}
          </button>
        </div>
      </form>
    </div>
  );
}