import type { TimetableCourse, TimetableScheduleItem } from '@workspace/api-client-react';

export interface CalendarEvent {
  id: string;
  course: TimetableCourse;
  schedule: TimetableScheduleItem;
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: number; // 2 = Monday ... 8 = Sunday
  dayLabel: string; // "Thứ 2", "Thứ 3", etc.
  startTime: string; // "07:00"
  endTime: string; // "09:25"
  periodLabel: string; // "Tiết 1 - 3"
  periods: number[];
  periodSlotId: 'morning_1' | 'morning_2' | 'afternoon_1' | 'afternoon_2';
  room: string;
  lecturer: string;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getJsDayToVnDay(jsDay: number): number {
  return jsDay === 0 ? 8 : jsDay + 1; // 0 (Sun) -> 8, 1 (Mon) -> 2, etc.
}

export function getPeriodSlot(periods: number[]): {
  slotId: 'morning_1' | 'morning_2' | 'afternoon_1' | 'afternoon_2';
  startTime: string;
  endTime: string;
  periodLabel: string;
} {
  const minPeriod = Math.min(...(periods.length > 0 ? periods : [1]));
  if (minPeriod <= 3) {
    return { slotId: 'morning_1', startTime: '07:00', endTime: '09:25', periodLabel: 'Tiết 1 - 3' };
  }
  if (minPeriod <= 6) {
    return { slotId: 'morning_2', startTime: '09:35', endTime: '12:00', periodLabel: 'Tiết 4 - 6' };
  }
  if (minPeriod <= 9) {
    return { slotId: 'afternoon_1', startTime: '12:30', endTime: '14:55', periodLabel: 'Tiết 7 - 9' };
  }
  return { slotId: 'afternoon_2', startTime: '15:05', endTime: '17:30', periodLabel: 'Tiết 10 - 12' };
}

export function resolveSpecificRoom(
  defaultRoom: string,
  scheduleRoom: string,
  phase: number,
  dayOfWeek: number
): string {
  const roomText = scheduleRoom || defaultRoom || 'Phòng học';
  
  // Check if room text has day specific tags like [T4] or [T6]
  const dayTag = `[T${dayOfWeek}]`;
  if (roomText.includes(dayTag)) {
    const afterTag = roomText.split(dayTag)[1] || '';
    const clean = afterTag.split('[')[0].replace(/TA1-\s*8T-HN/gi, '').trim();
    if (clean) return clean;
  }

  // Check if room text has phase specific tags like (1,3,5) 302-TA1 (2) 504-TA1
  const phaseRegex = new RegExp(`\\([\\d,]*${phase}[\\d,]*\\)\\s*([^\(]+)`, 'i');
  const phaseMatch = roomText.match(phaseRegex);
  if (phaseMatch && phaseMatch[1]) {
    let clean = phaseMatch[1].replace(/TA1-\s*8T-HN/gi, '').trim();
    if (clean.includes('[')) {
      if (clean.includes(dayTag)) {
        clean = clean.split(dayTag)[1]?.split('[')[0]?.trim() || clean;
      } else {
        clean = clean.split('[')[0]?.trim() || clean;
      }
    }
    if (clean) return clean;
  }

  // Clean default room
  return roomText.replace(/TA1-\s*8T-HN/gi, '').trim() || roomText;
}

/**
 * Expands all course schedules into actual individual calendar event occurrences
 * on concrete dates between their respective start and end dates.
 */
export function generateAllCalendarEvents(courses: TimetableCourse[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  courses.forEach((course) => {
    course.schedules.forEach((schedule, schIdx) => {
      if (!schedule.startDate || !schedule.endDate) return;

      const start = parseDate(schedule.startDate);
      const end = parseDate(schedule.endDate);
      if (!start || !end) return;

      const targetVnDay = schedule.dayOfWeek;
      const periods = schedule.periods && schedule.periods.length > 0 ? schedule.periods : [1, 2, 3];
      const { slotId, startTime, endTime, periodLabel } = getPeriodSlot(periods);

      // Iterate day by day from start to end
      const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const endLimit = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

      while (curr <= endLimit) {
        const vnDay = getJsDayToVnDay(curr.getDay());

        if (vnDay === targetVnDay) {
          const dateString = formatDateKey(curr);
          const room = resolveSpecificRoom(course.room, schedule.room, schedule.phase, vnDay);

          events.push({
            id: `${course.courseCode || course.stt}-${schIdx}-${dateString}-${slotId}`,
            course,
            schedule,
            date: new Date(curr),
            dateString,
            dayOfWeek: vnDay,
            dayLabel: schedule.dayName || `Thứ ${vnDay}`,
            startTime,
            endTime,
            periodLabel,
            periods,
            periodSlotId: slotId,
            room,
            lecturer: course.lecturer || 'Giảng viên',
          });
        }

        // Advance 1 day
        curr.setDate(curr.getDate() + 1);
      }
    });
  });

  // Sort events by date and startTime
  events.sort((a, b) => {
    const dDiff = a.date.getTime() - b.date.getTime();
    if (dDiff !== 0) return dDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  return events;
}

/**
 * Returns all dates for a given month calendar grid (starts with Monday or Sunday).
 * Typically returns 35 or 42 days covering the month.
 */
export function getMonthCalendarGrid(year: number, month: number, startOnSunday = true): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const days: Date[] = [];
  const startDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const offset = startOnSunday ? startDay : (startDay === 0 ? 6 : startDay - 1);

  // Add leading days from previous month
  for (let i = offset; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }

  // Add days of current month
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add trailing days from next month to complete 5 or 6 weeks (multiples of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/**
 * Returns the 7 days of the week containing the given date.
 */
export function getWeekDays(referenceDate: Date, startOnSunday = true): Date[] {
  const day = referenceDate.getDay();
  const diff = startOnSunday ? day : (day === 0 ? 6 : day - 1);

  const startOfWeek = new Date(referenceDate);
  startOfWeek.setDate(referenceDate.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}
