export function formatStoredDate(date, dateFormat = 'DMY') {
  if (!date) return '';
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(date);
  const [, year, month, day] = match;
  if (dateFormat === 'MDY') return `${month}/${day}/${year}`;
  if (dateFormat === 'YMD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

export function formatStoredTime(time, timeFormat = '12h') {
  if (!time) return '';
  const match = String(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(time);
  const hours = Number(match[1]);
  const minutes = match[2];
  if (timeFormat === '24h') return `${String(hours).padStart(2, '0')}:${minutes}`;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

export function formatStoredDateTime(date, time, preferences = {}) {
  const formattedDate = formatStoredDate(date, preferences.dateFormat);
  const formattedTime = formatStoredTime(time, preferences.timeFormat);
  return [formattedDate, formattedTime].filter(Boolean).join('  |  ');
}

export function getWeekdayLabels(weekStartsOn = 0) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const offset = weekStartsOn === 1 ? 1 : 0;
  return [...days.slice(offset), ...days.slice(0, offset)];
}

export function formatDateBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
