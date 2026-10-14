import React, { useState } from 'react';

export default function AddMemberModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🧑🏽');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), avatar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
        <h3 className="font-bold text-base">Add Family Member</h3>
        <input
          type="text"
          placeholder="Member Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          required
        />
        <div className="flex gap-2">
          {['👨🏽', '👩🏽', '👦🏽', '👧🏽', '👴🏽', '👵🏽'].map((av) => (
            <button
              type="button"
              key={av}
              onClick={() => setAvatar(av)}
              className={
                'text-xl p-2 rounded-xl border cursor-pointer ' +
                (avatar === av ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-800 bg-slate-950')
              }
            >
              {av}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded-xl text-xs bg-indigo-600 text-white font-semibold cursor-pointer">
            Add Member
          </button>
        </div>
      </form>
    </div>
  );
}