import { useMemo } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useCurriculum } from '@/hooks/use-curriculum';
import { calculateGpa } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function AnalyticsPage() {
  const { grades, gpaScale } = useGpaData();
  const { progressStats } = useCurriculum();

  const overallStats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);

  // Group by semester
  const semestersData = useMemo(() => {
    const map = new Map<string, typeof grades>();
    grades.forEach((g) => {
      const key = `${g.year}|${g.term}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });

    const entries = Array.from(map.entries()).sort((a, b) => {
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
        id,
        label: `Kỳ ${term}\n(${year})`,
        credits: semStats.credits,
        gpaSem: parseFloat(semStats.gpa4.toFixed(2)),
        gpaCum: parseFloat(cumGpa4.toFixed(2)),
      };
    });
  }, [grades, gpaScale]);

  // Grade Letter Distribution Breakdown
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'A+': 0,
      A: 0,
      'B+': 0,
      B: 0,
      'C+': 0,
      C: 0,
      'D+': 0,
      D: 0,
      F: 0,
    };

    grades.forEach((g) => {
      if (g.letter && counts[g.letter] !== undefined) {
        counts[g.letter]++;
      }
    });

    return Object.entries(counts).map(([grade, count]) => ({
      grade,
      count,
    }));
  }, [grades]);

  // Best subjects vs subjects needing attention
  const validCoursesWithScore = useMemo(() => {
    return grades
      .filter((g) => g.course && !isNaN(parseFloat(g.course)))
      .map((g) => ({
        ...g,
        scoreNum: parseFloat(g.course),
      }))
      .sort((a, b) => b.scoreNum - a.scoreNum);
  }, [grades]);

  const topCourses = validCoursesWithScore.slice(0, 3);
  const lowestCourses = [...validCoursesWithScore].reverse().slice(0, 3);

  const GRADE_COLORS: Record<string, string> = {
    'A+': '#10B981',
    A: '#10B981',
    'B+': '#635BFF',
    B: '#635BFF',
    'C+': '#F59E0B',
    C: '#F59E0B',
    'D+': '#EF4444',
    D: '#EF4444',
    F: '#991B1B',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand" />
            Thống kê & Phân tích Học tập
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Phân tích xu hướng điểm số, phân bố điểm chữ và tiến độ tích lũy tín chỉ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
            {overallStats.credits} / {progressStats.totalRequired} Tín chỉ
          </Badge>
        </div>
      </div>

      {/* Top Charts Grid: GPA Trend + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: GPA Trend */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand" />
            <h3 className="font-extrabold text-sm text-foreground">
              Biểu đồ GPA theo từng học kỳ
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            So sánh điểm GPA từng kỳ và GPA tích lũy toàn khóa
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={semestersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635BFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 4]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111318',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gpaCum"
                  stroke="#635BFF"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsGrad)"
                  name="GPA Tích lũy"
                />
                <Area
                  type="monotone"
                  dataKey="gpaSem"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                  name="GPA Học kỳ"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Grade Letter Distribution */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand" />
            <h3 className="font-extrabold text-sm text-foreground">
              Phân bố điểm chữ (A / B / C / D / F)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Số lượng học phần theo từng thang điểm chữ đã đạt được
          </p>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111318',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Số môn">
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade] || '#635BFF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top High Scoring Courses vs Courses to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Subjects */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-foreground">
              Môn học đạt điểm cao nhất
            </h3>
          </div>

          <div className="space-y-2.5">
            {topCourses.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-xs text-foreground leading-snug">
                    {c.subject}
                  </h4>
                  <p className="text-[10.5px] font-mono text-muted-foreground mt-0.5">
                    {c.code} • {c.credits} Tín chỉ
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-400 block">
                    {c.course}
                  </span>
                  <Badge className="bg-emerald-600 text-white font-bold text-[9px] px-1 py-0">
                    Điểm {c.letter}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects Needing Improvement */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-foreground">
              Môn học cần cải thiện hoặc học lại
            </h3>
          </div>

          <div className="space-y-2.5">
            {lowestCourses.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-xs text-foreground leading-snug">
                    {c.subject}
                  </h4>
                  <p className="text-[10.5px] font-mono text-muted-foreground mt-0.5">
                    {c.code} • {c.credits} Tín chỉ
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-black text-amber-700 dark:text-amber-400 block">
                    {c.course}
                  </span>
                  <Badge className="bg-amber-500 text-white font-bold text-[9px] px-1 py-0">
                    Điểm {c.letter}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
