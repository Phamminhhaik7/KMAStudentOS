import { useState, useMemo, useEffect } from 'react';
import { useTimetable } from '@/hooks/use-timetable';
import { useGpaData } from '@/hooks/use-gpa-data';
import { NavigationHeader } from '@/components/navigation-header';
import { QldtLoginDialog } from '@/components/qldt-login-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  User,
  Clock,
  GraduationCap,
  CalendarDays,
  Loader2,
  Search,
  School,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { TimetableCourse } from '@workspace/api-client-react';
import {
  generateAllCalendarEvents,
  getMonthCalendarGrid,
  getWeekDays,
  formatDateKey,
  CalendarEvent,
  parseDate,
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

const DEFAULT_SEMESTERS = [
  { id: '45584e93d80340daa51ff2d2d83c59bd', name: '1_2026_2027', selected: true },
  { id: '40dfa224e67c40a1b07880473085873e', name: '3_2025_2026', selected: false },
  { id: 'e2cfff3ec6ae4fae9e5383b250f8e3cb', name: '2_2025_2026', selected: false },
  { id: 'c6e4c6b836db402d89ee0b79d4c2eb92', name: '1_2025_2026', selected: false },
  { id: '185fff76e5fc4094ad907abadf8e2c92', name: '2_2024_2025', selected: false },
  { id: 'd3320f14e08b4763bcd2a360a07bd0cd', name: '1_2024_2025', selected: false },
];

// Rich pastel theme matching the user's FullCalendar snippet
const EVENT_PALETTES = [
  { bg: 'bg-blue-100 dark:bg-blue-950/70', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-950 dark:text-blue-200', badge: 'bg-blue-200/80 text-blue-900' },
  { bg: 'bg-orange-100 dark:bg-orange-950/70', border: 'border-orange-300 dark:border-orange-800', text: 'text-orange-950 dark:text-orange-200', badge: 'bg-orange-200/80 text-orange-900' },
  { bg: 'bg-teal-100 dark:bg-teal-950/70', border: 'border-teal-300 dark:border-teal-800', text: 'text-teal-950 dark:text-teal-200', badge: 'bg-teal-200/80 text-teal-900' },
  { bg: 'bg-yellow-100 dark:bg-yellow-950/70', border: 'border-yellow-300 dark:border-yellow-800', text: 'text-yellow-950 dark:text-yellow-200', badge: 'bg-yellow-200/80 text-yellow-900' },
  { bg: 'bg-pink-100 dark:bg-pink-950/70', border: 'border-pink-300 dark:border-pink-800', text: 'text-pink-950 dark:text-pink-200', badge: 'bg-pink-200/80 text-pink-900' },
  { bg: 'bg-purple-100 dark:bg-purple-950/70', border: 'border-purple-300 dark:border-purple-800', text: 'text-purple-950 dark:text-purple-200', badge: 'bg-purple-200/80 text-purple-900' },
  { bg: 'bg-emerald-100 dark:bg-emerald-950/70', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-950 dark:text-emerald-200', badge: 'bg-emerald-200/80 text-emerald-900' },
  { bg: 'bg-sky-100 dark:bg-sky-950/70', border: 'border-sky-300 dark:border-sky-800', text: 'text-sky-950 dark:text-sky-200', badge: 'bg-sky-200/80 text-sky-900' },
  { bg: 'bg-rose-100 dark:bg-rose-950/70', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-950 dark:text-rose-200', badge: 'bg-rose-200/80 text-rose-900' },
  { bg: 'bg-amber-100 dark:bg-amber-950/70', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-950 dark:text-amber-200', badge: 'bg-amber-200/80 text-amber-900' },
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
    selectedSemester,
    setSelectedSemester,
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

  // View state: 'month' | 'week' | 'day'
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Active viewing date in calendar (defaults to today or earliest semester date)
  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => new Date());

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // Semesters list
  const semestersList = useMemo(() => {
    return timetable?.semesters && timetable.semesters.length > 0
      ? timetable.semesters
      : DEFAULT_SEMESTERS;
  }, [timetable?.semesters]);

  const currentSemesterLabel = useMemo(() => {
    return timetable?.semesterName || 'Học kỳ 1 Năm học 2026_2027 Đợt học 1';
  }, [timetable?.semesterName]);

  const currentSemesterValue = useMemo(() => {
    if (selectedSemester) return selectedSemester;
    const foundSelected = semestersList.find((s) => s.selected);
    return foundSelected ? foundSelected.id : semestersList[0].id;
  }, [selectedSemester, semestersList]);

  // Expand all course schedules into discrete calendar occurrences
  const allEvents = useMemo(() => {
    if (!timetable?.courses) return [];
    return generateAllCalendarEvents(timetable.courses);
  }, [timetable?.courses]);

  // When courses are loaded, if current view date has no events, set view date to an active month
  useEffect(() => {
    if (allEvents.length > 0) {
      const hasEventsInCurrentMonth = allEvents.some(
        (e) =>
          e.date.getFullYear() === currentViewDate.getFullYear() &&
          e.date.getMonth() === currentViewDate.getMonth()
      );
      if (!hasEventsInCurrentMonth) {
        // Jump to first event date (e.g. November/December 2026)
        setCurrentViewDate(new Date(allEvents[0].date));
      }
    }
  }, [allEvents]);

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

  // Today's events
  const todayEvents = useMemo(() => {
    return eventsByDate.get(todayKey) || [];
  }, [eventsByDate, todayKey]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentViewDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentViewDate((prev) => {
      const d = new Date(prev);
      if (calendarView === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (calendarView === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentViewDate(new Date());
  };

  // Calendar Header Title Text
  const calendarTitleText = useMemo(() => {
    const y = currentViewDate.getFullYear();
    const m = currentViewDate.getMonth() + 1;

    if (calendarView === 'month') {
      return `tháng ${m} năm ${y}`;
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

    const dNum = String(currentViewDate.getDate()).padStart(2, '0');
    const vnDay = DAYS_HEADER[currentViewDate.getDay()]?.fullLabel || 'Ngày';
    return `${vnDay}, ${dNum} tháng ${m}, ${y}`;
  }, [currentViewDate, calendarView]);

  // Month grid dates
  const monthGridDates = useMemo(() => {
    return getMonthCalendarGrid(currentViewDate.getFullYear(), currentViewDate.getMonth(), true);
  }, [currentViewDate]);

  // Week days
  const weekDaysList = useMemo(() => {
    return getWeekDays(currentViewDate, true);
  }, [currentViewDate]);

  // Formatted realtime date string
  const formattedRealtimeString = useMemo(() => {
    const dayName = DAYS_HEADER[realtimeDate.getDay()]?.fullLabel || 'Hôm nay';
    const day = String(realtimeDate.getDate()).padStart(2, '0');
    const month = String(realtimeDate.getMonth() + 1).padStart(2, '0');
    const year = realtimeDate.getFullYear();
    return `${dayName}, ngày ${day}/${month}/${year}`;
  }, [realtimeDate]);

  // Sync to GPA Handler
  const handleSyncToGpa = () => {
    if (!timetable?.courses || timetable.courses.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Chưa có môn học',
        description: 'Vui lòng đăng nhập QLĐT để tải thời khóa biểu trước khi đồng bộ.',
      });
      return;
    }

    const year = timetable.semesterYear || '2026_2027';
    const term = timetable.semesterTerm || '1';

    const coursesToImport = timetable.courses.map((c) => ({
      subjectName: c.subjectName,
      courseCode: c.courseCode,
      credits: c.credits,
    }));

    const countAdded = importSubjectsFromTimetable(coursesToImport, year, term);

    toast({
      title: 'Đồng bộ môn học thành công! 🎉',
      description: `Đã đưa ${countAdded > 0 ? `${countAdded} môn mới` : 'các môn'} vào Bảng tính GPA.`,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation('/')}
          className="font-semibold text-xs border-primary/40 gap-1 text-primary"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Xem GPA
        </Button>
      ),
    });
  };

  const hasCourses = timetable?.courses && timetable.courses.length > 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Navigation Header */}
      <NavigationHeader
        studentName={timetable?.studentName}
        studentId={timetable?.studentId}
        isLive={timetable?.isLive}
        portalTitle="Đăng nhập QLĐT"
        onOpenPortalSettings={() => setLoginDialogOpen(true)}
        courseCount={timetable?.courses?.length}
        onSyncData={handleSyncSchedule}
        isSyncing={isSyncing}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6">

        {/* 🌟 BANNER HÔM NAY NGÀY BAO NHIÊU & HÔM NAY HỌC Ở ĐÂU */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background shadow-md overflow-hidden relative rounded-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Realtime Date */}
              <div className="space-y-1 shrink-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-bold px-2 py-0.5 text-[11px] uppercase tracking-wider rounded-md">
                    Hôm nay
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">Thời gian thực</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                  {formattedRealtimeString}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {todayEvents.length > 0
                      ? `Bạn có ${todayEvents.length} buổi học hôm nay`
                      : 'Hôm nay không có tiết học trên giảng đường'}
                  </span>
                </p>
              </div>

              {/* Right Column: Classroom details for today */}
              <div className="flex-1 lg:max-w-2xl">
                {hasCourses ? (
                  todayEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {todayEvents.map((ev) => {
                        const pal = courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEventDetail(ev)}
                            className={`p-3 rounded-xl border ${pal.border} ${pal.bg} cursor-pointer hover:shadow-md transition-all flex flex-col justify-between`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2 py-0.5 shadow-2xs">
                                🏢 {ev.room}
                              </Badge>
                              <span className="font-mono text-xs font-bold text-foreground">
                                {ev.startTime} ({ev.periodLabel})
                              </span>
                            </div>
                            <p className="font-bold text-xs sm:text-sm text-foreground leading-snug line-clamp-1">
                              {ev.course.subjectName}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                              <span className="truncate flex items-center gap-1">
                                <User className="w-3 h-3 text-primary shrink-0" />
                                <span className="truncate">{ev.lecturer}</span>
                              </span>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {ev.course.credits} TC
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-card/80 border border-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-foreground">
                          Hôm nay không có lịch học
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Chúc bạn một ngày tự học và nghỉ ngơi thật hiệu quả!
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-3.5 rounded-xl bg-card/80 border border-dashed border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <School className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Đăng nhập QLĐT để tải lịch học và vị trí phòng học của bạn.
                      </p>
                    </div>
                    <Button
                      onClick={() => setLoginDialogOpen(true)}
                      size="sm"
                      className="font-semibold text-xs h-8 gap-1.5 shadow-sm"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Đăng nhập
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📅 FULLCALENDAR WRAPPER & TOOLBAR MATCHING USER HTML */}
        <div className="calendar-wrapper w-full bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-5">
          {/* FC Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5">
            {/* Left: Button Group (Prev, Next, Today) */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 w-9 p-0 rounded-lg border-border"
                title="Trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-9 w-9 p-0 rounded-lg border-border"
                title="Sau"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 px-3 text-xs font-semibold rounded-lg border-border"
              >
                Hôm nay
              </Button>
            </div>

            {/* Center: Toolbar Title */}
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-foreground capitalize text-center">
              {calendarTitleText}
            </h2>

            {/* Right: View Mode & GPA Sync */}
            <div className="flex items-center gap-2 shrink-0">
              {hasCourses && (
                <Button
                  onClick={handleSyncToGpa}
                  size="sm"
                  className="h-8.5 font-semibold text-xs gap-1.5 shadow-2xs bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-3"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Đồng bộ GPA</span>
                </Button>
              )}

              <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    calendarView === 'month'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    calendarView === 'week'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tuần
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarView('day')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    calendarView === 'day'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ngày
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="py-24 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2.5" />
              <p className="text-sm font-semibold text-foreground">Đang tải lịch học...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !hasCourses && (
            <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-xl p-6">
              <CalendarDays className="w-12 h-12 text-primary/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">Chưa có dữ liệu Thời khóa biểu</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Đăng nhập tài khoản QLĐT ACTVN để tải lịch học thực tế các tuần và tháng.
              </p>
              <Button
                onClick={() => setLoginDialogOpen(true)}
                size="sm"
                className="mt-4 font-semibold text-xs gap-1.5 shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập ngay
              </Button>
            </div>
          )}

          {/* 📅 VIEW 1: MONTH CALENDAR GRID (dayGridMonth) */}
          {!isLoading && hasCourses && calendarView === 'month' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left border border-border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-semibold">
                    {DAYS_HEADER.map((d) => (
                      <th key={d.dayIndex} className="p-2.5 text-center border-r last:border-r-0 border-border">
                        <span className="font-bold text-foreground text-xs sm:text-sm">{d.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {Array.from({ length: Math.ceil(monthGridDates.length / 7) }).map((_, weekIdx) => {
                    const weekDates = monthGridDates.slice(weekIdx * 7, (weekIdx + 1) * 7);
                    return (
                      <tr key={weekIdx} className="h-28 sm:h-32">
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
                                  setCurrentViewDate(dateObj);
                                  setCalendarView('day');
                                }
                              }}
                              className={`p-1.5 border-r last:border-r-0 border-border align-top transition-colors ${
                                !isCurrentMonth
                                  ? 'bg-muted/15 opacity-40'
                                  : isToday
                                  ? 'bg-primary/10 border-2 border-primary/50'
                                  : 'hover:bg-muted/10'
                              } ${dayEvs.length > 0 ? 'cursor-pointer' : ''}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-[11px] font-bold font-mono px-1 rounded-sm ${
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

                              {/* Events inside Day */}
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
                                      className={`p-1 rounded-md border text-[10px] leading-tight cursor-pointer hover:shadow-md transition-shadow ${pal.bg} ${pal.border} ${pal.text}`}
                                    >
                                      <div className="font-bold flex items-center justify-between gap-1">
                                        <span>{ev.startTime}</span>
                                        <span className="font-bold font-mono px-1 py-0 rounded bg-background/70 text-[9px] truncate max-w-[60px]">
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
          )}

          {/* 📅 VIEW 2: WEEK CALENDAR VIEW (timeGridWeek) */}
          {!isLoading && hasCourses && calendarView === 'week' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left border border-border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground font-semibold">
                    <th className="p-3 w-28 text-center border-r border-border font-mono uppercase text-[11px]">
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
                              ? 'bg-primary/20 text-primary border-b-2 border-b-primary font-black'
                              : 'text-foreground'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold text-xs sm:text-sm">{dayName}</span>
                            <span className={`text-[11px] font-mono ${isToday ? 'font-bold' : 'text-muted-foreground'}`}>
                              {dateDisplay}
                            </span>
                            {isToday && (
                              <Badge className="bg-primary text-primary-foreground font-black text-[9px] px-1.5 py-0 mt-0.5">
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
                      {/* Period Column */}
                      <td className="p-3 border-r border-border bg-muted/20 text-center align-top">
                        <p className="font-bold text-foreground text-xs">{slot.label}</p>
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{slot.time}</p>
                        <Badge variant="outline" className="mt-1 text-[9px] px-1 py-0">
                          {slot.session}
                        </Badge>
                      </td>

                      {/* 7 Days Columns for THIS WEEK */}
                      {weekDaysList.map((dObj, dIdx) => {
                        const dKey = formatDateKey(dObj);
                        const isToday = dKey === todayKey;
                        const dayEvs = eventsByDate.get(dKey) || [];
                        const matchingEvs = dayEvs.filter((e) => e.periodSlotId === slot.id);

                        return (
                          <td
                            key={dIdx}
                            className={`p-2 border-r last:border-r-0 border-border align-top min-w-[130px] h-32 ${
                              isToday ? 'bg-primary/5 border-x-2 border-primary/40' : ''
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
                                      className={`p-2 rounded-xl border cursor-pointer hover:shadow-md transition-all ${pal.bg} ${pal.border} ${pal.text} ${
                                        isToday ? 'ring-2 ring-primary/40 shadow-xs' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-1.5 py-0 shadow-2xs">
                                          📍 {ev.room}
                                        </Badge>
                                        <span className="text-[10px] font-bold font-mono">
                                          {ev.course.credits} TC
                                        </span>
                                      </div>
                                      <p className="font-bold text-xs leading-snug line-clamp-2">
                                        {ev.course.subjectName}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground truncate mt-1 flex items-center gap-1">
                                        <User className="w-3 h-3 text-primary shrink-0" />
                                        <span className="truncate">{ev.lecturer}</span>
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center opacity-10">
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
          )}

          {/* 📅 VIEW 3: DAY VIEW (timeGridDay) */}
          {!isLoading && hasCourses && calendarView === 'day' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-foreground">{calendarTitleText}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {eventsByDate.get(formatDateKey(currentViewDate))?.length || 0} buổi học được xếp lịch
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarView('month')}
                  className="text-xs font-semibold h-8"
                >
                  Về xem tháng
                </Button>
              </div>

              <div className="space-y-3">
                {(eventsByDate.get(formatDateKey(currentViewDate)) || []).map((ev) => {
                  const pal = courseColorMap.get(ev.course.courseCode || ev.course.stt) || EVENT_PALETTES[0];
                  return (
                    <Card
                      key={ev.id}
                      onClick={() => setSelectedEventDetail(ev)}
                      className={`border ${pal.border} ${pal.bg} cursor-pointer hover:shadow-md transition-all rounded-2xl`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5">
                              🏢 {ev.room}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bold font-mono">
                              {ev.course.courseCode}
                            </Badge>
                          </div>
                          <span className="font-mono text-xs font-bold text-foreground">
                            {ev.startTime} - {ev.endTime} ({ev.periodLabel})
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-base text-foreground">{ev.course.subjectName}</h4>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{ev.course.className}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <User className="w-4 h-4 text-primary" />
                            {ev.lecturer}
                          </span>
                          <span className="font-bold text-primary">{ev.course.credits} Tín chỉ</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {(eventsByDate.get(formatDateKey(currentViewDate)) || []).length === 0 && (
                  <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl p-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-sm text-foreground">Không có tiết học vào ngày này</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Bạn có thể chọn ngày khác để xem lịch.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Event / Course Detail Modal */}
      <Dialog
        open={!!selectedEventDetail}
        onOpenChange={(open) => !open && setSelectedEventDetail(null)}
      >
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          {selectedEventDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {selectedEventDetail.course.courseCode}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-bold">
                    {selectedEventDetail.course.credits} Tín chỉ
                  </Badge>
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    {selectedEventDetail.room}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold leading-snug">
                  {selectedEventDetail.course.subjectName}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-muted-foreground">
                  {selectedEventDetail.course.className}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border">
                  <div>
                    <p className="text-muted-foreground text-[11px]">Giảng viên giảng dạy</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">
                      {selectedEventDetail.lecturer || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Địa điểm phòng học</p>
                    <p className="font-bold text-foreground text-sm mt-0.5 text-primary">
                      {selectedEventDetail.room}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Thời gian học</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">
                      {selectedEventDetail.startTime} - {selectedEventDetail.endTime} ({selectedEventDetail.periodLabel})
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[11px]">Đợt học</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">
                      Đợt {selectedEventDetail.schedule.phase} ({selectedEventDetail.schedule.startDate} → {selectedEventDetail.schedule.endDate})
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground text-xs mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Tất cả các đợt học của môn này:
                  </h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {selectedEventDetail.course.schedules.map((sch, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-border/80 bg-card flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {sch.dayName} • Tiết {sch.periods?.join(', ') || 'N/A'}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground">({sch.lessonType || 'LT'})</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Thời gian: {sch.startDate} đến {sch.endDate} (Đợt {sch.phase})
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
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

      {/* Login QLĐT Dialog */}
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
