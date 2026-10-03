import { CalendarEvent, TimetableEntry, WeekdayName } from '../types';

/**
 * Formats a date string (YYYY-MM-DD) and optional time (HH:MM) into iCalendar DTSTART / DTEND format.
 */
function formatIcsDateTime(dateStr: string, timeStr?: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (!timeStr) {
    return cleanDate; // All-day date (YYYYMMDD)
  }
  const cleanTime = timeStr.replace(/:/g, '').padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Escapes characters per RFC 5545 iCalendar specification
 */
function escapeIcsText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Finds the next occurrence date for a given weekday name starting from a base reference date.
 */
function getNextWeekdayDate(dayName: WeekdayName, baseDate: Date = new Date()): string {
  const dayMap: Record<WeekdayName, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  } as any;

  const targetDay = dayMap[dayName] ?? 1;
  const currentDay = baseDate.getDay();
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7; // Next week if already passed

  const nextDate = new Date(baseDate);
  nextDate.setDate(baseDate.getDate() + diff);

  const y = nextDate.getFullYear();
  const m = String(nextDate.getMonth() + 1).padStart(2, '0');
  const d = String(nextDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Maps weekday name to iCalendar RRULE BYDAY code
 */
function getIcsByDay(day: WeekdayName): string {
  const map: Record<WeekdayName, string> = {
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA',
  };
  return map[day] || 'MO';
}

/**
 * Generates an RFC 5545 compliant .ics string for a list of CalendarEvent objects.
 */
export function generateCalendarEventsIcs(
  events: CalendarEvent[],
  calendarName: string = 'COMPORA - Academic Calendar'
): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//COMPORA//Academic Management Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  events.forEach((evt) => {
    const isAllDay = evt.category === 'Holiday' || (!evt.start_time && !evt.end_time);
    const uid = `${evt.id || Date.now()}@compora.college.edu`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);

    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatIcsDateTime(evt.date)}`);
      // For all day event, end date is next day in RFC 5545
      const parts = evt.date.split('-');
      if (parts.length === 3) {
        const nextD = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) + 1);
        const nextDStr = `${nextD.getFullYear()}${String(nextD.getMonth() + 1).padStart(2, '0')}${String(nextD.getDate()).padStart(2, '0')}`;
        lines.push(`DTEND;VALUE=DATE:${nextDStr}`);
      } else {
        lines.push(`DTEND;VALUE=DATE:${formatIcsDateTime(evt.date)}`);
      }
    } else {
      const startTime = evt.start_time || '09:00';
      const endTime = evt.end_time || '10:00';
      lines.push(`DTSTART:${formatIcsDateTime(evt.date, startTime)}`);
      lines.push(`DTEND:${formatIcsDateTime(evt.date, endTime)}`);
    }

    lines.push(`SUMMARY:${escapeIcsText(evt.title)}`);

    const descParts: string[] = [];
    if (evt.category) descParts.push(`Category: ${evt.category}`);
    if (evt.department && evt.department !== 'ALL') descParts.push(`Department: ${evt.department}`);
    if (evt.year && evt.year !== 'ALL') descParts.push(`Year: ${evt.year}`);
    if (evt.section && evt.section !== 'ALL') descParts.push(`Section: ${evt.section}`);
    if (evt.target_audience) descParts.push(`Target: ${evt.target_audience}`);
    if (evt.organizer) descParts.push(`Organizer: ${evt.organizer}`);
    if (evt.description) descParts.push(`\n${evt.description}`);

    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join(' | '))}`);

    if (evt.location) {
      lines.push(`LOCATION:${escapeIcsText(evt.location)}`);
    }

    if (evt.category) {
      lines.push(`CATEGORIES:${escapeIcsText(evt.category)}`);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generates an RFC 5545 compliant .ics string for weekly Timetable entries,
 * configured as recurring weekly calendar events until the end of the academic term.
 */
export function generateTimetableIcs(
  entries: TimetableEntry[],
  scheduleTitle: string = 'COMPORA - Weekly Timetable'
): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  // Default end of academic semester: 2026-12-31
  const semesterUntil = '20261231T235959Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//COMPORA//Academic Timetable Timelines//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(scheduleTitle)}`,
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  entries.forEach((entry) => {
    const nextDate = getNextWeekdayDate(entry.day);
    const byDay = getIcsByDay(entry.day);
    const uid = `tt-${entry.id || Date.now()}@compora.college.edu`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${formatIcsDateTime(nextDate, entry.start_time)}`);
    lines.push(`DTEND:${formatIcsDateTime(nextDate, entry.end_time)}`);
    lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${semesterUntil};BYDAY=${byDay}`);

    const summary = entry.subject_code
      ? `${entry.subject_code}: ${entry.subject_name}`
      : entry.subject_name;
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);

    const descParts = [
      `Subject: ${entry.subject_name} (${entry.subject_code || ''})`,
      `Faculty: ${entry.teacher_name}`,
      `Class: ${entry.year} ${entry.department} ${entry.section}`,
      `Room / Laboratory: ${entry.room}`,
      `Schedule: Every ${entry.day} ${entry.start_time} - ${entry.end_time}`,
    ];
    lines.push(`DESCRIPTION:${escapeIcsText(descParts.join(' | '))}`);

    lines.push(`LOCATION:${escapeIcsText(entry.room)}`);
    lines.push('CATEGORIES:Class,Lecture,Academics');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download of an .ics file
 */
export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a direct Google Calendar template web link for quick 1-click addition.
 */
export function generateGoogleCalendarUrl(evt: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  const startTime = evt.start_time ? evt.start_time.replace(/:/g, '') + '00' : '090000';
  const endTime = evt.end_time ? evt.end_time.replace(/:/g, '') + '00' : '100000';
  const dateStr = evt.date.replace(/-/g, '');

  const dates = `${dateStr}T${startTime}/${dateStr}T${endTime}`;
  const text = encodeURIComponent(evt.title);
  const details = encodeURIComponent(
    `${evt.description || ''}\n\nCategory: ${evt.category}\nTarget: ${evt.target_audience || 'All'}\nOrganizer: ${evt.organizer || 'COMPORA'}`
  );
  const location = encodeURIComponent(evt.location || 'Main Campus');

  return `${baseUrl}&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}
