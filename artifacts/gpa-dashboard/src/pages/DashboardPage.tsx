import { useMemo } from 'react';
import { Link } from 'wouter';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useTimetable } from '@/hooks/use-timetable';
import { useTasks } from '@/hooks/use-tasks';
import { useExams } from '@/hooks/use-exams';
import { useCurriculum } from '@/hooks/use-curriculum';
import { calculateGpa } from '@/lib/utils';
import { generateAllCalendarEvents, formatDateKey } from '@/lib/calendar-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  Plus,
  School,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function DashboardPage() {
  const { grades, gpaScale, userInfo } = useGpaData();
  const { timetable } = useTimetable();
  const { tasks, toggleTaskStatus } = useTasks();
  const { exams } = useExams();
  const { progressStats } = useCurriculum();

  const studentName = userInfo?.name || timetable?.studentName || 'Phạm Minh Hải';
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  // GPA Stats
  const overallStats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);
  const targetGpa = 3.2; // Default target
  const totalGraduationCredits = progressStats.totalRequired;
  const progressPercent = progressStats.percent;

  // Today's classes
  const allEvents = useMemo(() => {
    if (!timetable?.courses) return [];
    return generateAllCalendarEvents(timetable.courses);
  }, [timetable?.courses]);

  const todayClasses = useMemo(() => {
    return allEvents.filter((ev) => ev.dateString === todayKey);
  }, [allEvents, todayKey]);

  // Upcoming pending tasks (first 4)
  const pendingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [tasks]);

  // Upcoming exams
  const upcomingExams = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return exams
      .filter((e) => e.examDate >= today)
      .sort((a, b) => a.examDate.localeCompare(b.examDate))
      .slice(0, 2);
  }, [exams]);

  // Next exam countdown
  const nextExam = upcomingExams[0];
  const daysUntilNextExam = useMemo(() => {
    if (!nextExam) return null;
    const diff = new Date(nextExam.examDate).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [nextExam]);

  // GPA Trend Chart Data by Semester
  const gpaTrendData = useMemo(() => {
    const semMap = new Map<string, typeof grades>();
    grades.forEach((g) => {
      const key = `${g.year}|${g.term}`;
      if (!semMap.has(key)) semMap.set(key, []);
      semMap.get(key)!.push(g);
    });

    const entries = Array.from(semMap.entries()).sort((a, b) => {
      const [yA, tA] = a[0].split('|');
      const [yB, tB] = b[0].split('|');
      if (yA !== yB) return yA.localeCompare(yB);
      return tA.localeCompare(tB);
    });

    let cumCredits = 0;
    let cumPoints4 = 0;

    return entries.map(([id, semGrades]) => {
      const [year, term] = id.split('|');
      const semStats = calculateGpa(semGrades, gpaScale);

      cumCredits += semStats.credits;
      cumPoints4 += semStats.gpa4 * semStats.credits;
      const cumGpa4 = cumCredits > 0 ? cumPoints4 / cumCredits : semStats.gpa4;

      return {
        semester: `Kỳ ${term}`,
        gpaSem: parseFloat(semStats.gpa4.toFixed(2)),
        gpaCum: parseFloat(cumGpa4.toFixed(2)),
      };
    });
  }, [grades, gpaScale]);

  return (
    <div className="space-y-6">
      {/* 🌟 Greeting Banner (Linear Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Chào {studentName} 👋
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-2 flex-wrap">
            <span>
              Hôm nay bạn có <strong className="text-foreground font-bold">{todayClasses.length} tiết học</strong>
            </span>
            <span className="opacity-30">•</span>
            <span>
              <strong className="text-foreground font-bold">{pendingTasks.length} bài tập</strong> sắp đến hạn
            </span>
            {daysUntilNextExam !== null && (
              <>
                <span className="opacity-30">•</span>
                <span className="text-brand font-bold">
                  Kỳ thi kế tiếp còn {daysUntilNextExam} ngày
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/schedule">
            <Button size="sm" variant="outline" className="h-8.5 text-xs font-bold rounded-xl border-border">
              <Calendar className="w-3.5 h-3.5 mr-1 text-brand" />
              Xem thời khóa biểu
            </Button>
          </Link>
        </div>
      </div>

      {/* 📊 4 Core Academic OS Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: GPA Hệ 4 */}
        <div className="bg-primary text-primary-foreground p-4 sm:p-5 rounded-2xl border border-primary shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-wider">GPA Hệ 4</p>
            <Badge className="bg-white text-primary text-[9px] font-black px-1.5 py-0 border-none">
              {overallStats.classification}
            </Badge>
          </div>
          <div className="my-2">
            <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white">
              {overallStats.gpa4.toFixed(2)}
            </h3>
            <span className="text-[11px] text-primary-foreground/70 font-mono">/ 4.00 thang điểm</span>
          </div>
          <p className="text-[10.5px] text-primary-foreground/80 truncate">Điểm trung bình tích lũy</p>
        </div>

        {/* Card 2: GPA Hệ 10 */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">GPA Hệ 10</p>
            <GraduationCap className="w-4 h-4 text-brand" />
          </div>
          <div className="my-2">
            <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-foreground">
              {overallStats.gpa10.toFixed(2)}
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">/ 10.00 thang điểm</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground truncate">Điểm tổng kết KMA</p>
        </div>

        {/* Card 3: Tín chỉ hoàn thành */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tín chỉ</p>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="my-2">
            <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-foreground">
              {overallStats.credits}
            </h3>
            <span className="text-[11px] text-muted-foreground font-mono">/ {totalGraduationCredits} tín chỉ</span>
          </div>
          <p className="text-[10.5px] text-muted-foreground truncate">Còn {Math.max(0, totalGraduationCredits - overallStats.credits)} TC để tốt nghiệp</p>
        </div>

        {/* Card 4: Tiến độ chương trình */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tiến độ tốt nghiệp</p>
            <Award className="w-4 h-4 text-success" />
          </div>
          <div className="my-2">
            <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-foreground">
              {progressPercent}%
            </h3>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[10.5px] text-muted-foreground truncate">Mục tiêu GPA: {targetGpa.toFixed(2)}</p>
        </div>
      </div>

      {/* 2-Column Grid: Today's Timeline + Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's Classes + GPA Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Section */}
          <div className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border/70">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Lịch học hôm nay
                </h3>
              </div>
              <Link href="/schedule">
                <span className="text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 cursor-pointer">
                  Toàn bộ lịch <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            {todayClasses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayClasses.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/30 flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary text-primary-foreground font-black text-xs px-2 py-0.5">
                        🏢 {ev.room}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {ev.startTime} - {ev.endTime}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                        {ev.course.subjectName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{ev.periodLabel}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40 font-medium">
                      <span className="truncate">{ev.lecturer}</span>
                      <span className="font-bold font-mono">{ev.course.credits} TC</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="font-bold text-xs text-foreground">Hôm nay không có tiết học trên giảng đường</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Chúc bạn có một ngày tự học và nghỉ ngơi thoải mái!
                </p>
              </div>
            )}
          </div>

          {/* GPA Trend Preview Chart */}
          <div className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Tiến độ GPA qua các học kỳ
                </h3>
              </div>
              <Link href="/gpa">
                <span className="text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 cursor-pointer">
                  Chi tiết điểm <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            {gpaTrendData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gpaTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="semester" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 4]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111318',
                        borderRadius: '12px',
                        border: '1px solid #242730',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gpaCum"
                      stroke="#E11D48"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gpaGradient)"
                      name="GPA Tích lũy"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                <p>Chưa có dữ liệu bảng điểm để vẽ biểu đồ.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tasks & Upcoming Exams */}
        <div className="space-y-6">
          {/* Upcoming Tasks Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border/70">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-warning" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Công việc & Deadline
                </h3>
              </div>
              <Link href="/tasks">
                <span className="text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 cursor-pointer">
                  Tất cả <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            <div className="space-y-2.5">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskStatus(task.id)}
                    className="p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-start gap-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 rounded cursor-pointer accent-brand"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-snug truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span className="font-mono">Hạn: {task.dueDate}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 font-bold ${
                            task.priority === 'high'
                              ? 'text-destructive border-destructive/30 bg-destructive/5'
                              : task.priority === 'medium'
                              ? 'text-warning border-warning/30 bg-warning/5'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {task.priority === 'high' ? 'Gấp' : task.priority === 'medium' ? 'Vừa' : 'Thường'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  <p className="font-semibold">Không có deadline nào tồn đọng 🎉</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Exam Countdown Card */}
          <div className="bg-card rounded-2xl border border-border shadow-xs p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-border/70">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground">
                  Lịch thi sắp tới
                </h3>
              </div>
              <Link href="/exams">
                <span className="text-xs text-muted-foreground hover:text-foreground font-bold flex items-center gap-1 cursor-pointer">
                  Xem hết <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>

            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-xl bg-accent/40 border border-border flex items-center justify-between gap-3"
                  >
                    <div>
                      <Badge className="bg-primary text-primary-foreground font-black text-[10px] px-2 py-0 mb-1">
                        🏢 {ex.room}
                      </Badge>
                      <h4 className="font-bold text-xs text-foreground leading-snug">
                        {ex.subjectName}
                      </h4>
                      <p className="text-[10.5px] font-mono text-muted-foreground mt-0.5">
                        Ngày {ex.examDate} • {ex.examTime}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-brand block">
                        {ex.studentNo || 'KMA'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <p>Chưa có lịch thi nào được xếp.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
