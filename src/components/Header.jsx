import React from 'react';
import { Pill, Save, FolderOpen, UserPlus, X } from 'lucide-react';

export default function Header({
  appData,
  activeMemberId,
  setActiveMemberId,
  linkedFileName,
  fileHandle,
  unsavedChanges,
  onSave,
  onOpen,
  onAddMember,
  onDeleteMember
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight flex items-center gap-2">
              <span>MedTrack</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {fileHandle ? '🔗 Remembered: ' + linkedFileName : '📄 ' + linkedFileName}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Family Tablet & Schedule Tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className={
              'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer ' +
              (unsavedChanges
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white')
            }
          >
            <Save className="w-3.5 h-3.5" />
            <span>{unsavedChanges ? 'Save File *' : 'Save File'}</span>
          </button>

          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Open File</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {appData.members.map((member) => {
          const active = member.id === activeMemberId;
          return (
            <div
              key={member.id}
              className={
                'inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap transition ' +
                (active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }
            >
              <button
                onClick={() => setActiveMemberId(member.id)}
                className="flex items-center gap-2 pl-3.5 pr-2 py-1.5 cursor-pointer"
              >
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </button>
              {appData.members.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMember(member.id, member.name);
                  }}
                  className={
                    'pr-2.5 pl-1 py-1.5 rounded-r-full transition cursor-pointer ' +
                    (active ? 'text-indigo-200 hover:text-white' : 'text-slate-500 hover:text-rose-400')
                  }
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={onAddMember}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-indigo-400 border border-dashed border-slate-700 whitespace-nowrap cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Member</span>
        </button>
      </div>
    </header>
  );
}