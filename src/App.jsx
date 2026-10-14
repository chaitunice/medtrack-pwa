import React, { useState, useEffect, useRef } from 'react';
import {
  Check, X, Plus, Trash2, Bell, Calendar, UserPlus,
  Smartphone, Download, Upload, FileJson, FolderOpen,
  Save, Sun, CloudSun, Moon, Pill, CheckCircle2, Link2,
  Utensils, CalendarClock, Repeat
} from 'lucide-react';

// ==========================================
// 1. DEFAULT JSON FILE STRUCTURE
// ==========================================
const SESSION_BUFFER_KEY = 'medtrack_file_buffer_v2';
const DEFAULT_FILENAME = 'medtrack-data.json';

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TODAY_STR = formatDateKey(new Date());

const DEFAULT_FILE_DATA = {
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
      foodTiming: 'after', // 'before' | 'after' | 'with' | 'any'
      frequencyType: 'weekly', // 'daily' | 'weekly' | 'schedule'
      weekDays: [0], // 0 = Sunday
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
    },
    {
      id: 'med3',
      memberId: 'm2',
      name: 'Calcium + Vit D',
      dosage: '500mg',
      slots: ['afternoon'],
      foodTiming: 'after',
      frequencyType: 'daily',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 1,
      startDate: TODAY_STR,
      endDate: ''
    },
    {
      id: 'med4',
      memberId: 'm3',
      name: 'Multivitamin Drops',
      dosage: '5ml',
      slots: ['morning'],
      foodTiming: 'after',
      frequencyType: 'schedule',
      weekDays: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: 2, // Every 2 days
      startDate: TODAY_STR,
      endDate: ''
    }
  ],
  // Format: { "YYYY-MM-DD": { "medId_slot": "taken" | "skipped" } }
  logs: {},
  reminders: {
    morning: { time: '08:00', enabled: true },
    afternoon: { time: '13:30', enabled: true },
    night: { time: '21:00', enabled: true }
  }
};

const loadInitialBuffer = () => {
  try {
    const cached = localStorage.getItem(SESSION_BUFFER_KEY);
    if (cached) return { ...DEFAULT_FILE_DATA, ...JSON.parse(cached) };
  } catch (e) {
    console.warn('Could not read session buffer:', e);
  }
  return DEFAULT_FILE_DATA;
};

// ==========================================
// 2. CONSTANTS & SCHEDULE EVALUATOR
// ==========================================
const SLOTS = [
  { id: 'morning', label: 'Morning', emoji: '☀️', icon: Sun, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { id: 'afternoon', label: 'Afternoon', emoji: '🌤️', icon: CloudSun, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { id: 'night', label: 'Night', emoji: '🌙', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' }
];

const FOOD_OPTIONS = [
  { id: 'before', label: 'Before Food', short: 'Before Meal', emoji: '🍽️⬅️', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { id: 'after', label: 'After Food', short: 'After Meal', emoji: '🍽️➡️', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'with', label: 'With Food', short: 'With Meal', emoji: '🥗', badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { id: 'any', label: 'Anytime', short: 'No Food Rule', emoji: '💧', badgeClass: 'bg-slate-800 text-slate-400 border-slate-700' }
];

const WEEKDAY_LABELS = [
  { day: 1, short: 'M', name: 'Mon' },
  { day: 2, short: 'T', name: 'Tue' },
  { day: 3, short: 'W', name: 'Wed' },
  { day: 4, short: 'T', name: 'Thu' },
  { day: 5, short: 'F', name: 'Fri' },
  { day: 6, short: 'S', name: 'Sat' },
  { day: 0, short: 'S', name: 'Sun' }
];

// Evaluates if a tablet is scheduled for a given "YYYY-MM-DD"