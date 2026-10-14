import { TODAY_STR } from '../constants';

export const isMedScheduledForDate = (med, dateKey) => {
  const target = new Date(dateKey + 'T00:00:00');
  const freq = med.frequencyType || 'daily';

  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    const days = Array.isArray(med.weekDays) ? med.weekDays : [0, 1, 2, 3, 4, 5, 6];
    return days.includes(target.getDay());
  }

  if (freq === 'schedule') {
    const startStr = med.startDate || TODAY_STR;
    const start = new Date(startStr + 'T00:00:00');
    if (target < start) return false;

    if (med.endDate) {
      const end = new Date(med.endDate + 'T00:00:00');
      if (target > end) return false;
    }

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    const interval = Math.max(1, parseInt(med.intervalDays, 10) || 1);
    return diffDays % interval === 0;
  }

  return true;
};

export const getScheduleBadgeText = (med) => {
  const freq = med.frequencyType || 'daily';
  if (freq === 'daily') return 'Every Day';
  if (freq === 'weekly') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = (med.weekDays || []).map((d) => dayNames[d]).join(', ');
    return 'Weekly (' + (days || 'None') + ')';
  }
  if (freq === 'schedule') {
    const n = parseInt(med.intervalDays, 10) || 1;
    const base = n === 1 ? 'Daily Course' : 'Every ' + n + ' Days';
    if (med.endDate) return base + ' (until ' + med.endDate + ')';
    return base + ' (from ' + (med.startDate || TODAY_STR) + ')';
  }
  return 'Daily';
};

export const getCurrentWeekDays = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = y + '-' + m + '-' + day;
    return {
      key,
      shortDay: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: key === new Date().toISOString().split('T')[0]
    };
  });
};