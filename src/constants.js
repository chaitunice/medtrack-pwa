import { Sun, CloudSun, Moon } from 'lucide-react';

export const SESSION_BUFFER_KEY = 'medtrack_file_buffer_v3';
export const DEFAULT_FILENAME = 'medtrack-data.json';
export const HANDLE_DB_NAME = 'MedTrackFileHandleDB';
export const HANDLE_STORE = 'handles';

export const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

export const TODAY_STR = formatDateKey(new Date());

export const DEFAULT_FILE_DATA = {
  appName: 'MedTrack Family Tablet Tracker',
  updatedAt: new Date().toISOString(),
  members: [
    { id: 'm1', name: 'Chaithanya', avatar: '👨🏽' },
    { id: 'm2', name: 'Divya', avatar: '👩🏽' },
    { id: 'm3', name: 'Yuvansh', avatar: '👦🏽' }
  ],
  medications: [
    {
      id: 'med1',
      memberId: 'm1',
      name: 'Vitamin D3',
      dosage: '60000 IU',
      slots: ['morning'],
      foodTiming: 'after',
      frequencyType: 'weekly',
      weekDays: [0],
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    },
    {
      id: 'med2',
      memberId: 'm1',
      name: 'Pantoprazole',
      dosage: '40mg',
      slots: ['morning'],
      foodTiming: 'before',
      frequencyType: 'daily',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    }
  ],
  logs: {},
  reminders: {
    morning: { time: '08:00', enabled: true },
    afternoon: { time: '13:30', enabled: true },
    night: { time: '20:30', enabled: true }
  }
};

export const SLOTS = [
  { id: 'morning', label: 'Morning', emoji: '☀️', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌤️', icon: CloudSun, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'night', label: 'Evening', emoji: '🌙', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' }
];

export const FOOD_OPTIONS = [
  { id: 'before', label: 'Before Food', emoji: '🍽️⬅️', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'after', label: 'After Food', emoji: '🍽️➡️', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'with', label: 'With Food', emoji: '🥗', badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { id: 'any', label: 'Anytime', emoji: '💧', badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' }
];

export const WEEKDAY_LABELS = [
  { day: 1, name: 'Mon' },
  { day: 2, name: 'Tue' },
  { day: 3, name: 'Wed' },
  { day: 4, name: 'Thu' },
  { day: 5, name: 'Fri' },
  { day: 6, name: 'Sat' },
  { day: 0, name: 'Sun' }
];