import React from 'react';
import { CheckCircle2, Calendar, Bell, Smartphone, FileJson } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'today', label: 'Today', icon: CheckCircle2 },
    { id: 'weekly', label: 'Weekly Grid', icon: Calendar },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'simulator', label: '2s Hold', icon: Smartphone },
    { id: 'file', label: 'JSON File', icon: FileJson }
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                'flex flex-col items-center justify-center py-1 text-[11px] font-medium transition cursor-pointer ' +
                (active ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200')
              }
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}