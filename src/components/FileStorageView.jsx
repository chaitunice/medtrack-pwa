import React from 'react';
import { FileJson, Save, Link2, Upload } from 'lucide-react';

export default function FileStorageView({
  linkedFileName,
  appData,
  onSave,
  onSaveAs,
  onOpen
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <FileJson className="w-5 h-5 text-indigo-400" />
            <span>Remembered File Storage ({linkedFileName})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            MedTrack remembers the last file path you saved to. If that file is moved or deleted, it automatically asks where to save again.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save to Same File</span>
          </button>

          <button
            onClick={onSaveAs}
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold px-3.5 py-2 rounded-xl border border-emerald-500/30 transition cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            <span>Save As (Change File Path)</span>
          </button>

          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Open .JSON File</span>
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
  );
}