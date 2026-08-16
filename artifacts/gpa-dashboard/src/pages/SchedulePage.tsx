import { useState, useMemo, useEffect } from 'react';
import { useTimetable } from '@/hooks/use-timetable';
import { useGpaData } from '@/hooks/use-gpa-data';
import { NavigationHeader } from '@/components/navigation-header';
import { QldtLoginDialog } from '@/components/qldt-login-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Clock,
  GraduationCap,
  CalendarDays,
  Loader2,
  School,
  LogIn,
  CheckCircle2,
  List,
  Calendar as CalendarIcon,
  MapPin,
  BookOpen,
} from 'lucide-react';
import {
  generateAllCalendarEvents,
  getMonthCalendarGrid,
  getWeekDays,
  formatDateKey,
  CalendarEvent,
} from '@/lib/calendar-utils';

const DAYS_HEADER = [
  { dayIndex: 0, label: 'CN', fullLabel: 'Chủ Nhật' },
  { dayIndex: 1, label: 'Thứ 2', fullLabel: 'Thứ Hai' },
  { dayIndex: 2, label: 'Thứ 3', fullLabel: 'Thứ Ba' },
  { dayIndex: 3, label: 'Thứ 4', fullLabel: 'Thứ Tư' },
  { dayIndex: 4, label: 'Thứ 5', fullLabel: 'Thứ Năm' },
  { dayIndex: 5, label: 'Thứ 6', fullLabel: 'Thứ Sáu' },
  { dayIndex: 6, label: 'Thứ 7', fullLabel: 'Thứ Bảy' },
];

const PERIOD_SLOTS = [
  { id: 'morning_1', label: 'Tiết 1 - 3', time: '07:00 - 09:25', session: 'Sáng' },
  { id: 'morning_2', label: 'Tiết 4 - 6', time: '09:35 - 12:00', session: 'Sáng' },
  { id: 'afternoon_1', label: 'Tiết 7 - 9', time: '12:30 - 14:55', session: 'Chiều' },
  { id: 'afternoon_2', label: 'Tiết 10 - 12', time: '15:05 - 17:30', session: 'Chiều' },
];

// Clean pastel tones with high contrast text
const EVENT_PALETTES = [
  { bg: 'bg-blue-50 dark:bg-blue-950/60', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-950 dark:text-blue-100', dot: 'bg-blue-600' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-950 dark:text-emerald-100', dot: 'bg-emerald-600' },
  { bg: 'bg-amber-50 dark:bg-amber-950/60', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-950 dark:text-amber-100', dot: 'bg-amber-600' },
  { bg: 'bg-purple-50 dark:bg-purple-950/60', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-950 dark:text-purple-100', dot: 'bg-purple-600' },
  { bg: 'bg-rose-50 dark:bg-rose-950/60', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-950 dark:text-rose-100', dot: 'bg-rose-600' },
  { bg: 'bg-sky-50 dark:bg-sky-950/60', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-950 dark:text-sky-100', dot: 'bg-sky-600' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/60', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-950 dark:text-indigo-100', dot: 'bg-indigo-600' },
  { bg: 'bg-teal-50 dark:bg-teal-950/60', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-950 dark:text-teal-100', dot: 'bg-teal-600' },
];

export function SchedulePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Current real-time clock
  const [realtimeDate, setRealtimeDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setRealtimeDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = useMemo(() => formatDateKey(realtimeDate), [realtimeDate]);

  const {
    timetable,
    isLoading,
    hasCookie,
    login,
    saveCookieDirectly,
    logout,
    syncTimetable,
  } = useTimetable();

  const { importSubjectsFromTimetable } = useGpaData();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncSchedule = async () => {
    setIsSyncing(true);
    try {
      const res = await syncTimetable();
      if (res.success) {
        toast({
          title: 'Đồng bộ thời khóa biểu thành công! 🎉',
          description: res.reauthenticated
            ? 'Đã tự động đăng nhập lại bằng tài khoản đã lưu và cập nhật lịch học mới nhất.'
            : 'Thời khóa biểu của bạn đã được cập nhật mới nhất từ Cổng QLĐT.',
        });
      } else if (res.requireLogin) {
        toast({
          variant: 'destructive',
          title: 'Phiên đăng nhập QLĐT đã hết hạn',
          description: 'Vui lòng đăng nhập để hệ thống lưu tài khoản và tự động đồng bộ.',
        });
        setLoginDialogOpen(true);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đồng bộ',
        description: err?.message || 'Không thể kết nối đến Cổng QLĐT.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // View state: 'week' | 'month' | 'agenda' (default: 'week' as per modern calendar specs)
  const [calendarView, setCalendarView] = useState<'week' | 'month' | 'agenda'>('week');
  
  // Month / Week view viewing base date
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date());

  // Interactive selected date (for Mobile Month Matrix & Selected Day details)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // Expand all course schedules into discrete calendar occurrences
  const allEvents = useMemo(() => {
    if (!timetable?.courses) return [];
    return generateAllCalendarEvents(timetable.courses);
  }, [timetable?.courses]);

  // Color mapping per course
  const courseColorMap = useMemo(() => {
    const map = new Map<string, (typeof EVENT_PALETTES)[0]>();
    if (timetable?.courses) {
      (Array.isArray(timetable.courses) ? timetable.courses : []).forEach((c, idx) => {
        const pal = EVENT_PALETTES[idx % EVENT_PALETTES.length];
        map.set(c.courseCode || c.stt, pal);
      });
    }
    return map;
  }, [timetable?.courses]);

  // Events indexed by dateString (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    allEvents.forEach((ev) => {
      if (!map.has(ev.dateString)) {
        map.set(ev.dateString, []);
      }
      map.get(ev.dateString)!.push(ev);
    });
    return map;
  }, [allEvents]);

  // Initialize view date to earliest active month if today has no events
  useEffect(() => {
    if (allEvents.length > 0) {
      const hasEventsInCurrentMonth = allEvents.some(
        (e) =>
          e.date.getFullYear() === currentViewDate.getFullYear() &&
          e.date.getMonth() === currentViewDate.getMonth()
      );
      if (!hasEventsInCurrentMonth) {
        const firstDate = new Date(allEvents[0].date);
        setCurrentViewDate(firstDate);
        setSelectedDate(firstDate);
      }
    }
  }, [allEvents]);

  // Sorted list of dates with events for Agenda view
  const datesWithEvents = useMemo(() => {
    const keys = Array.from(eventsByDate.keys()).sort();
    return keys.map((key) => {
      const evs = eventsByDate.get(key) || [];
      return {
        dateString: key,
        date: evs[0]?.date || new Date(),
        events: evs,
      };
    });
  }, [eventsByDate]);

  // Today's events
  const todayEvents = useMemo(() => {
    return eventsByDate.get(todayKey) || [];
  }, [eventsByDate, todayKey]);

  // Selected date key and its events
  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const selectedDateEvents = useMemo(() => eventsByDate.get(selectedDateKey) || [], [eventsByDate, selectedDateKey]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentViewDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month' || calendarView === 'agenda') {
        d.setMonth(d.getMonth() - 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentViewDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month' || calendarView === 'agenda') {
        d.setMonth(d.getMonth() + 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentViewDate(now);
    setSelectedDate(now);
  };

  // Calendar Header Title Text
  const calendarTitleText = useMemo(() => {
    const y = currentViewDate.getFullYear();
    const m = currentViewDate.getMonth() + 1;

    if (calendarView === 'month' || calendarView === 'agenda') {
      return `Tháng ${m}, ${y}`;
    }

    if (calendarView === 'week') {
      const weekDays = getWeekDays(currentViewDate, true);
      const first = weekDays[0];
      const last = weekDays[6];
      const fDay = String(first.getDate()).padStart(2, '0');
      const fMon = String(first.getMonth() + 1).padStart(2, '0');
      const lDay = String(last.getDate()).padStart(2, '0');
      const lMon = String(last.getMonth() + 1).padStart(2, '0');
      return `Tuần ${fDay}/${fMon} – ${lDay}/${lMon}/${y}`;
    }

    return `Tháng ${m}, ${y}`;
  }, [currentViewDate, calendarView]);

  const monthGridDates = useMemo(() => {
    return getMonthCalendarGrid(currentViewDate.getFullYear(), currentViewDate.getMonth(), true);
  }, [currentViewDate]);

  const weekDaysList = useMemo(() => {
    return getWeekDays(currentViewDate, true);
  }, [currentViewDate]);

  const formattedRealtimeString = useMemo(() => {
    const dayName = DAYS_HEADER[realtimeDate.getDay()]?.fullLabel || 'Hôm nay';
    const day = String(realtimeDate.getDate()).padStart(2, '0');
    const month = String(realtimeDate.getMonth() + 1).padStart(2, '0');
    const year = realtimeDate.getFullYear();
    return `${dayName}, ngày ${day}/${month}/${year}`;
  }, [realtimeDate]);

  // Selected date formatted label
  const formattedSelectedDateString = useMemo(() => {
    const dayName = DAYS_HEADER[selectedDate.getDay()]?.fullLabel || 'Ngày';
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    return `${dayName}, ngày ${day}/${month}/${year}`;
  }, [selectedDate]);

  // Auto-sync timetable courses into GPA calculation seamlessly without requiring button click
  useEffect(() => {
    if (timetable?.courses && timetable.courses.length > 0) {
      const year = timetable.semesterYear || '2026_2027';
      const term = timetable.semesterTerm || '1';
      const coursesToImport = timetable.courses.map((c) => ({
        subjectName: c.subjectName,
        courseCode: c.courseCode,
        credits: c.credits,
      }));
      importSubjectsFromTimetable(coursesToImport, year, term);
    }
  }, [timetable?.courses, timetable?.semesterYear, timetable?.semesterTerm, importSubjectsFromTimetable]);

  const hasCourses = timetable?.courses && timetable.courses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-brand" />
            Lịch Học & Thời Khóa Biểu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Thời khóa biểu các học phần đăng ký tại Cổng Đào tạo QLĐT ACTVN
          </p>
        </div>
      </div>
        {/* Banner: Hôm nay ngày bao nhiêu & Hôm nay học ở đâu (Loket Compact & High Impact) */}
        <Card className="border-border bg-card shadow-xs overflow-hidden rounded-2xl">
          <CardContent className="p-3.5 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-5">
              <div className="space-y-1 shrink-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-black px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-md">
                    Hôm nay
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">{formattedRealtimeString}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground">
                    {todayEvents.length > 0
                      ? `Bạn có ${todayEvents.length} buổi học trên giảng đường hôm nay`
                      : 'Hôm nay không có tiết học trên giảng đường'}
                  </span>
                </p>
              </div>

              <div className="flex-1 lg:max-w-xl">
                {hasCourses ? (
                  todayEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {todayEvents.map((ev) => {
                        const pal = courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEventDetail(ev)}
                            className={`p-2.5 sm:p-3 rounded-xl border ${pal.border} ${pal.bg} cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge className="bg-primary text-primary-foreground font-bold text-[11px] px-2 py-0 shadow-2xs">
                                🏢 {ev.room}
                              </Badge>
                              <span className="font-mono text-[11px] font-bold text-foreground">
                                {ev.startTime} ({ev.periodLabel})
                              </span>
                            </div>
                            <p className="font-bold text-xs text-foreground leading-snug line-clamp-1">
                              {ev.course.subjectName}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                              <span className="truncate flex items-center gap-1 font-medium">
                                <User className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{ev.lecturer}</span>
                              </span>
                              <span className="font-bold text-foreground font-mono shrink-0">
                                {ev.course.credits} TC
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground">
                          Nghỉ học hôm nay
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Chúc bạn một ngày tự học và nghỉ ngơi hiệu quả!
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-2.5 sm:p-3 rounded-xl bg-muted/30 border border-dashed border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        Đăng nhập QLĐT để tải thời khóa biểu thực tế.
                      </p>
                    </div>
                    <Button
                      onClick={() => setLoginDialogOpen(true)}
                      size="sm"
                      className="font-bold text-xs h-7.5 px-3 gap-1 shadow-2xs bg-primary text-primary-foreground rounded-lg"
                    >
                      <LogIn className="w-3 h-3" />
                      Đăng nhập
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toolbar: Navigation, Title & Views (Full Width & Zero Cut-off) */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-3.5 sm:p-4 space-y-3">
          {/* Row 1: Nav buttons + Month Title + GPA Sync */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-muted/70 p-0.5 rounded-xl border border-border/80">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="h-8 w-8 p-0 rounded-lg"
                  title="Trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="h-8 w-8 p-0 rounded-lg"
                  title="Sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 px-2.5 text-xs font-bold rounded-xl border-border hover:bg-muted"
              >
                Hôm nay
              </Button>
            </div>

            {/* Title */}
            <h2 className="text-sm sm:text-lg font-black tracking-tight text-foreground text-center truncate">
              {calendarTitleText}
            </h2>
          </div>

          {/* Row 2: Responsive Segmented Control for Views */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 w-full bg-muted/80 p-1 rounded-xl border border-border/70 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setCalendarView('month')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  calendarView === 'month'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Tháng</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarView('week')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  calendarView === 'week'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Tuần</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarView('agenda')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  calendarView === 'agenda'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lịch biểu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-card rounded-2xl border border-border">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2.5" />
            <p className="text-sm font-bold text-foreground">Đang tải lịch học...</p>
            <p className="text-xs text-muted-foreground mt-0.5">Đang đồng bộ dữ liệu với Cổng QLĐT</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasCourses && (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl p-6 shadow-xs">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Chưa có dữ liệu Thời khóa biểu</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
              Đăng nhập tài khoản QLĐT ACTVN để tải thời khóa biểu, phòng học và giảng viên trực tiếp.
            </p>
            <Button
              onClick={() => setLoginDialogOpen(true)}
              size="sm"
              className="mt-4 font-bold text-xs h-8.5 px-4 gap-1.5 shadow-xs bg-primary text-primary-foreground rounded-xl"
            >
              <LogIn className="w-3.5 h-3.5" />
              Đăng nhập Cổng QLĐT
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: MONTH VIEW (Hybrid Responsive: Mobile Matrix + Desktop Table)    */}
        {/* ========================================================================= */}
        {!isLoading && hasCourses && calendarView === 'month' && (
          <div className="space-y-4">
            {/* --- MOBILE COMPACT MONTH MATRIX (md:hidden) --- */}
            <div className="md:hidden bg-card rounded-2xl border border-border shadow-xs p-3 space-y-3">
              {/* 7-Day Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground pb-1 border-b border-border/60">
                {DAYS_HEADER.map((d) => (
                  <div key={d.dayIndex} className="py-1">
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>

              {/* 7-Day Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {monthGridDates.map((dateObj, idx) => {
                  const dateKey = formatDateKey(dateObj);
                  const isCurrentMonth = dateObj.getMonth() === currentViewDate.getMonth();
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedDateKey;
                  const dayEvs = eventsByDate.get(dateKey) || [];
                  const hasEvents = dayEvs.length > 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDate(dateObj)}
                      className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-black shadow-xs'
                          : isToday
                          ? 'bg-primary/10 text-primary font-extrabold ring-1 ring-primary/40'
                          : hasEvents
                          ? 'bg-muted/70 text-foreground font-bold hover:bg-muted'
                          : isCurrentMonth
                          ? 'text-foreground/90 hover:bg-muted/40'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      <span className="text-xs leading-none">{dateObj.getDate()}</span>

                      {/* Class indicators */}
                      {hasEvents && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {dayEvs.slice(0, 3).map((ev, eIdx) => {
                            const pal =
                              courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                            return (
                              <span
                                key={eIdx}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-white' : pal.dot
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- MOBILE SELECTED DAY CLASS STREAM (md:hidden) --- */}
            <div className="md:hidden space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <h3 className="font-extrabold text-xs text-foreground tracking-tight">
                    {formattedSelectedDateString}
                  </h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">
                  {selectedDateEvents.length > 0
                    ? `${selectedDateEvents.length} buổi học`
                    : 'Không có tiết'}
                </Badge>
              </div>

              {selectedDateEvents.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDateEvents.map((ev) => {
                    const pal =
                      courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                    return (
                      <Card
                        key={ev.id}
                        onClick={() => setSelectedEventDetail(ev)}
                        className={`border ${pal.border} ${pal.bg} rounded-2xl shadow-2xs cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all`}
                      >
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5 shadow-2xs">
                              🏢 {ev.room}
                            </Badge>
                            <span className="font-mono text-xs font-bold text-foreground">
                              {ev.startTime} - {ev.endTime} ({ev.periodLabel})
                            </span>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-foreground leading-snug">
                              {ev.course.subjectName}
                            </h4>
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{ev.course.className}</p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 font-medium">
                            <span className="truncate flex items-center gap-1.5 text-foreground max-w-[200px]">
                              <User className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{ev.lecturer}</span>
                            </span>
                            <span className="font-bold text-foreground font-mono shrink-0">
                              {ev.course.credits} Tín chỉ
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-card border border-dashed border-border text-center">
                  <p className="text-xs font-bold text-foreground">Không có lịch học vào ngày này</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Chọn các ngày có dấu chấm trên lịch để xem chi tiết phòng học.
                  </p>
                </div>
              )}
            </div>

            {/* --- DESKTOP EXPANDED MONTH TABLE (hidden md:block) --- */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-xs text-muted-foreground font-bold">
                    {DAYS_HEADER.map((d) => (
                      <th key={d.dayIndex} className="p-3 text-center border-r last:border-r-0 border-border/80">
                        <span className="font-bold text-foreground text-xs">{d.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {Array.from({ length: Math.ceil(monthGridDates.length / 7) }).map((_, weekIdx) => {
                    const weekDates = monthGridDates.slice(weekIdx * 7, (weekIdx + 1) * 7);
                    return (
                      <tr key={weekIdx} className="h-28 lg:h-32">
                        {weekDates.map((dateObj, dIdx) => {
                          const dateKey = formatDateKey(dateObj);
                          const isCurrentMonth = dateObj.getMonth() === currentViewDate.getMonth();
                          const isToday = dateKey === todayKey;
                          const dayEvs = eventsByDate.get(dateKey) || [];

                          return (
                            <td
                              key={dIdx}
                              onClick={() => {
                                if (dayEvs.length > 0) {
                                  setSelectedDate(dateObj);
                                }
                              }}
                              className={`p-1.5 border-r last:border-r-0 border-border align-top transition-colors ${
                                !isCurrentMonth
                                  ? 'bg-muted/20 opacity-40'
                                  : isToday
                                  ? 'bg-primary/5 border-2 border-primary/40'
                                  : 'hover:bg-muted/10'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                                    isToday
                                      ? 'bg-primary text-primary-foreground'
                                      : isCurrentMonth
                                      ? 'text-foreground'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {dateObj.getDate()}
                                </span>
                                {isToday && (
                                  <span className="text-[9px] font-black text-primary uppercase">Hôm nay</span>
                                )}
                              </div>

                              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                                {dayEvs.map((ev) => {
                                  const pal =
                                    courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                                  return (
                                    <div
                                      key={ev.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEventDetail(ev);
                                      }}
                                      className={`p-1.5 rounded-lg border text-[10px] leading-tight cursor-pointer hover:shadow-sm transition-shadow ${pal.bg} ${pal.border} ${pal.text}`}
                                    >
                                      <div className="font-bold flex items-center justify-between gap-1">
                                        <span>{ev.startTime}</span>
                                        <span className="font-bold font-mono px-1 py-0 rounded bg-background/80 text-[9px] truncate max-w-[55px]">
                                          {ev.room}
                                        </span>
                                      </div>
                                      <p className="truncate font-semibold mt-0.5">{ev.course.subjectName}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: WEEK VIEW (Mobile & Desktop Clean Support)                       */}
        {/* ========================================================================= */}
        {!isLoading && hasCourses && calendarView === 'week' && (
          <div className="space-y-4">
            {/* Mobile Week Day Picker */}
            <div className="md:hidden grid grid-cols-7 gap-1 bg-card p-2 rounded-2xl border border-border shadow-xs text-center">
              {weekDaysList.map((dObj, idx) => {
                const dKey = formatDateKey(dObj);
                const isSelected = dKey === selectedDateKey;
                const isToday = dKey === todayKey;
                const dayEvs = eventsByDate.get(dKey) || [];
                const dayName = DAYS_HEADER[dObj.getDay()]?.label || '';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(dObj)}
                    className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-black shadow-xs'
                        : isToday
                        ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/40'
                        : 'text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase">{dayName}</span>
                    <span className="text-xs font-bold font-mono mt-0.5">{dObj.getDate()}</span>
                    {dayEvs.length > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Selected Day Classes for Week View */}
            <div className="md:hidden space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-xs text-foreground">
                  {formattedSelectedDateString}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">
                  {selectedDateEvents.length} buổi học
                </Badge>
              </div>

              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((ev) => {
                  const pal = courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                  return (
                    <Card
                      key={ev.id}
                      onClick={() => setSelectedEventDetail(ev)}
                      className={`border ${pal.border} ${pal.bg} rounded-2xl shadow-2xs cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all`}
                    >
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                            🏢 {ev.room}
                          </Badge>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {ev.startTime} ({ev.periodLabel})
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-foreground leading-snug">
                          {ev.course.subjectName}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 font-medium">
                          <span className="truncate flex items-center gap-1.5 text-foreground max-w-[200px]">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{ev.lecturer}</span>
                          </span>
                          <span className="font-bold text-foreground font-mono shrink-0">
                            {ev.course.credits} TC
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="p-4 rounded-2xl bg-card border border-dashed border-border text-center">
                  <p className="text-xs font-bold text-foreground">Không có tiết học vào ngày này</p>
                </div>
              )}
            </div>

            {/* Desktop Week Grid Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] border-collapse text-left">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border text-xs text-muted-foreground font-bold">
                      <th className="p-3 w-24 text-center border-r border-border font-mono uppercase text-[11px]">
                        Ca / Tiết
                      </th>
                      {weekDaysList.map((dObj, idx) => {
                        const dKey = formatDateKey(dObj);
                        const isToday = dKey === todayKey;
                        const dayName = DAYS_HEADER[dObj.getDay()]?.label || '';
                        const dateDisplay = `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}`;

                        return (
                          <th
                            key={idx}
                            className={`p-3 text-center border-r last:border-r-0 border-border ${
                              isToday
                                ? 'bg-primary text-primary-foreground font-black'
                                : 'text-foreground'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-bold text-xs sm:text-sm">{dayName}</span>
                              <span className={`text-[11px] font-mono ${isToday ? 'text-primary-foreground/90 font-bold' : 'text-muted-foreground'}`}>
                                {dateDisplay}
                              </span>
                              {isToday && (
                                <Badge className="bg-white text-primary font-black text-[9px] px-1.5 py-0 mt-0.5 border-none">
                                  HÔM NAY
                                </Badge>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {PERIOD_SLOTS.map((slot) => (
                      <tr key={slot.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 border-r border-border bg-muted/20 text-center align-top">
                          <p className="font-bold text-foreground text-xs">{slot.label}</p>
                          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{slot.time}</p>
                          <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 rounded-md">
                            {slot.session}
                          </Badge>
                        </td>

                        {weekDaysList.map((dObj, dIdx) => {
                          const dKey = formatDateKey(dObj);
                          const isToday = dKey === todayKey;
                          const dayEvs = eventsByDate.get(dKey) || [];
                          const matchingEvs = dayEvs.filter((e) => e.periodSlotId === slot.id);

                          return (
                            <td
                              key={dIdx}
                              className={`p-2 border-r last:border-r-0 border-border align-top min-w-[120px] h-28 ${
                                isToday ? 'bg-primary/5 border-x-2 border-primary/30' : ''
                              }`}
                            >
                              {matchingEvs.length > 0 ? (
                                <div className="space-y-1.5">
                                  {matchingEvs.map((ev) => {
                                    const pal =
                                      courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                                    return (
                                      <div
                                        key={ev.id}
                                        onClick={() => setSelectedEventDetail(ev)}
                                        className={`p-2 rounded-xl border cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all ${pal.bg} ${pal.border} ${pal.text}`}
                                      >
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                          <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-1.5 py-0 shadow-2xs">
                                            🏢 {ev.room}
                                          </Badge>
                                          <span className="text-[10px] font-bold font-mono">
                                            {ev.course.credits} TC
                                          </span>
                                        </div>
                                        <p className="font-bold text-xs leading-snug line-clamp-2">
                                          {ev.course.subjectName}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate mt-1 flex items-center gap-1 font-medium">
                                          <User className="w-3 h-3 text-primary shrink-0" />
                                          <span className="truncate">{ev.lecturer}</span>
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="h-full w-full flex items-center justify-center opacity-15">
                                  <span className="text-[11px] font-mono">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: AGENDA STREAM VIEW (All Dates with Classes)                       */}
        {/* ========================================================================= */}
        {!isLoading && hasCourses && calendarView === 'agenda' && (
          <div className="space-y-5">
            {datesWithEvents.length > 0 ? (
              datesWithEvents.map(({ dateString, date, events }) => {
                const isToday = dateString === todayKey;
                const dNum = String(date.getDate()).padStart(2, '0');
                const mNum = String(date.getMonth() + 1).padStart(2, '0');
                const dayHeader = DAYS_HEADER[date.getDay()]?.fullLabel || 'Ngày';

                return (
                  <div key={dateString} className="space-y-2.5">
                    {/* Date Section Header */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold font-mono flex items-center gap-1.5 shadow-2xs ${
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground border border-border/80'
                        }`}
                      >
                        <span>{dayHeader}, {dNum}/{mNum}</span>
                        {isToday && <span className="text-[9px] bg-white/20 px-1 rounded">HÔM NAY</span>}
                      </div>
                      <div className="h-[1px] flex-1 bg-border/80" />
                      <span className="text-[11px] font-mono text-muted-foreground">{events.length} buổi học</span>
                    </div>

                    {/* Class Cards for this day */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {events.map((ev) => {
                        const pal = courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                        return (
                          <Card
                            key={ev.id}
                            onClick={() => setSelectedEventDetail(ev)}
                            className={`border ${pal.border} ${pal.bg} rounded-2xl shadow-2xs cursor-pointer hover:shadow-sm active:scale-[0.99] transition-all`}
                          >
                            <CardContent className="p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5 shadow-2xs">
                                    🏢 {ev.room}
                                  </Badge>
                                  <Badge variant="outline" className="text-[11px] font-mono font-bold bg-card">
                                    {ev.course.courseCode}
                                  </Badge>
                                </div>
                                <span className="font-mono text-xs font-bold text-foreground">
                                  {ev.startTime} ({ev.periodLabel})
                                </span>
                              </div>

                              <div>
                                <h4 className="font-extrabold text-sm sm:text-base text-foreground leading-snug">
                                  {ev.course.subjectName}
                                </h4>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{ev.course.className}</p>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 font-medium">
                                <span className="flex items-center gap-1.5 text-foreground truncate max-w-[200px]">
                                  <User className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{ev.lecturer}</span>
                                </span>
                                <span className="font-bold text-foreground font-mono shrink-0">
                                  {ev.course.credits} Tín chỉ
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-14 bg-card border rounded-2xl">
                <p className="font-bold text-sm text-foreground">Không có buổi học nào trong đợt này</p>
              </div>
            )}
          </div>
        )}

        {/* EVENT DETAIL MODAL (Responsive Dialog) */}
      <Dialog
        open={!!selectedEventDetail}
        onOpenChange={(open) => !open && setSelectedEventDetail(null)}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          {selectedEventDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {selectedEventDetail.course.courseCode}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {selectedEventDetail.course.credits} Tín chỉ
                  </Badge>
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    🏢 {selectedEventDetail.room}
                  </Badge>
                </div>
                <DialogTitle className="text-base sm:text-lg font-extrabold leading-snug">
                  {selectedEventDetail.course.subjectName}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-muted-foreground">
                  {selectedEventDetail.course.className}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-2.5 bg-muted/40 p-3.5 rounded-xl border border-border/80">
                  <div>
                    <p className="text-muted-foreground text-[10.5px] font-semibold">Giảng viên</p>
                    <p className="font-bold text-foreground text-xs sm:text-sm mt-0.5 truncate">
                      {selectedEventDetail.lecturer || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10.5px] font-semibold">Địa điểm phòng học</p>
                    <p className="font-bold text-foreground text-xs sm:text-sm mt-0.5 text-primary">
                      {selectedEventDetail.room}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10.5px] font-semibold">Thời gian ca học</p>
                    <p className="font-bold text-foreground text-xs sm:text-sm mt-0.5 font-mono">
                      {selectedEventDetail.startTime} - {selectedEventDetail.endTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10.5px] font-semibold">Đợt học</p>
                    <p className="font-bold text-foreground text-xs sm:text-sm mt-0.5">
                      Đợt {selectedEventDetail.schedule.phase}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-xs mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Lịch tất cả các buổi của môn này:
                  </h4>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedEventDetail.course.schedules.map((sch, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl border border-border/80 bg-card flex items-center justify-between gap-3 text-xs shadow-2xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {sch.dayName} • Tiết {sch.periods?.join(', ') || 'N/A'}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">({sch.lessonType || 'LT'})</span>
                          </p>
                          <p className="text-[10.5px] text-muted-foreground mt-0.5 font-mono">
                            {sch.startDate} → {sch.endDate} (Đợt {sch.phase})
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-mono font-bold">
                          {sch.room || selectedEventDetail.room}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <QldtLoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        hasCookie={hasCookie}
        isLive={timetable?.isLive || false}
        studentInfo={timetable?.studentInfo}
        onLogin={login}
        onSaveCookie={saveCookieDirectly}
        onLogout={logout}
      />
    </div>
  );
}

export default SchedulePage;
