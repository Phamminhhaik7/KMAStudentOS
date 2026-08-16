import { useMemo } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useCurriculum } from '@/hooks/use-curriculum';
import { calculateGpa } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronRight,
  School,
} from 'lucide-react';

const GROUP_COLORS = [
  { bar: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
  { bar: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
  { bar: 'bg-purple-600', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  { bar: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  { bar: 'bg-amber-600', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { bar: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' },
];

export function DegreeProgressPage() {
  const { grades, gpaScale } = useGpaData();
  const { curriculum, isLoading, progressStats, refreshCurriculum } = useCurriculum();

  const {
    totalRequired,
    totalCompleted,
    totalRemaining,
    percent: overallPercent,
    groupsSummary,
    majorName,
    academicYear,
  } = progressStats;

  // Set of completed course codes for lookup
  const completedCodes = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => {
      if (g.course && g.course !== '-' && g.letter !== 'F') {
        set.add(g.code.trim().toUpperCase());
      }
    });
    return set;
  }, [grades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-brand" />
            Tiến độ Tốt nghiệp & Khung Đào tạo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ngành: <strong className="text-foreground">{majorName}</strong> ({academicYear}) • Tổng chuẩn:{' '}
            <strong className="text-foreground">{totalRequired} tín chỉ</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCurriculum}
            disabled={isLoading}
            className="h-8.5 text-xs font-bold rounded-xl border-border hover:bg-muted/60 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới khung</span>
          </Button>

          <Badge className="bg-primary text-primary-foreground font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
            {overallPercent}% Hoàn thành
          </Badge>
        </div>
      </div>

      {/* Main Graduation Hero Card */}
      <Card className="border-border bg-card shadow-xs rounded-2xl p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tổng tín chỉ tích lũy thực tế
              </p>
              <h2 className="text-3xl sm:text-4xl font-mono font-black text-foreground mt-1">
                {totalCompleted}{' '}
                <span className="text-base text-muted-foreground font-normal">
                  / {totalRequired} Tín chỉ
                </span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-muted-foreground">
                Còn thiếu <strong className="text-brand">{totalRemaining} tín chỉ</strong> để tốt nghiệp
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-muted rounded-full h-3.5 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span>Khởi đầu (0 TC)</span>
              <span>Đạt chuẩn tốt nghiệp ({totalRequired} TC)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Knowledge Groups Breakdown */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand" />
          Phân bố chi tiết theo từng Khối kiến thức
        </h3>

        {groupsSummary.length === 0 ? (
          <Card className="border-border bg-card rounded-2xl p-8 text-center">
            <School className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-foreground">Đang tải khung chương trình đào tạo từ QLĐT...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Đăng nhập Cổng QLĐT để hệ thống tự động tải và lưu khung môn học của ngành.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupsSummary.map((group, idx) => {
              const theme = GROUP_COLORS[idx % GROUP_COLORS.length];
              return (
                <Card
                  key={group.groupName}
                  className="border-border bg-card rounded-2xl shadow-xs p-5 hover:border-brand/40 transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md ${theme.badge}`}>
                        {group.courses.length} Học phần
                      </span>
                      <h4 className="font-bold text-sm text-foreground tracking-tight leading-snug truncate">
                        {group.groupName}
                      </h4>
                    </div>

                    <span className="font-mono text-xs font-bold text-foreground whitespace-nowrap">
                      {group.completedCredits} / {group.totalCredits} TC
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                        style={{ width: `${group.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10.5px] text-muted-foreground font-mono">
                      <span>Tiến độ</span>
                      <span className="font-bold">{group.percent}%</span>
                    </div>
                  </div>

                  {/* List of courses in this group */}
                  <div className="pt-2 border-t border-border/60 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {group.courses.map((c) => {
                      const isPassed = completedCodes.has(c.courseCode.trim().toUpperCase());
                      return (
                        <div
                          key={c.courseCode}
                          className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isPassed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span
                              className={`truncate font-medium ${
                                isPassed ? 'text-foreground font-semibold' : 'text-muted-foreground'
                              }`}
                              title={c.subjectName}
                            >
                              {c.subjectName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[11px] text-muted-foreground font-bold">
                              {c.credits} TC
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isPassed
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isPassed ? 'Đã đạt' : 'Chưa học'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DegreeProgressPage;
