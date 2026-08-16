import { useMemo, useState } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { calculateGpa } from '@/lib/utils';
import { DashboardStats } from '@/components/dashboard-stats';
import { GoalPlanner } from '@/components/goal-planner';
import { SemesterCard } from '@/components/semester-card';
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { AuthDialog } from '@/components/cookie-dialog';
import { Button } from '@/components/ui/button';
import { Grade } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, BookOpen, GraduationCap, TrendingUp, School, LogIn } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function GpaPage() {
  const {
    grades,
    subjects,
    gpaScale,
    hasEdits,
    hasCookie,
    isLive,
    saveCredentials,
    clearCredentials,
    updateGrade,
    deleteGrade,
    addPlannedSubject,
    resetEdits,
  } = useGpaData();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const semesters = useMemo(() => {
    const map = new Map<string, Grade[]>();
    grades.forEach((g) => {
      const key = `${g.year}|${g.term}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });

    return Array.from(map.entries())
      .sort((a, b) => {
        const [yA, tA] = a[0].split('|');
        const [yB, tB] = b[0].split('|');
        if (yA !== yB) return yB.localeCompare(yA);
        return tB.localeCompare(tA);
      })
      .map(([id, grades]) => ({ id, grades }));
  }, [grades]);

  const existingSemesters = useMemo(() => {
    return semesters.map((s) => {
      const [y, t] = s.id.split('|');
      return { year: y, term: t };
    });
  }, [semesters]);

  const overallStats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);

  // GPA Trend Chart Data
  const gpaTrendData = useMemo(() => {
    const entries = [...semesters].reverse();
    let cumCredits = 0;
    let cumPoints4 = 0;

    return entries.map(({ id, grades: semGrades }) => {
      const [year, term] = id.split('|');
      const semStats = calculateGpa(semGrades, gpaScale);

      cumCredits += semStats.credits;
      cumPoints4 += semStats.gpa4 * semStats.credits;
      const cumGpa4 = cumCredits > 0 ? cumPoints4 / cumCredits : semStats.gpa4;

      return {
        semester: `Kỳ ${term} (${year})`,
        gpaSem: parseFloat(semStats.gpa4.toFixed(2)),
        gpaCum: parseFloat(cumGpa4.toFixed(2)),
      };
    });
  }, [semesters, gpaScale]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand" />
            GPA & Điểm số
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Theo dõi chi tiết bảng điểm từng học kỳ, dự phóng điểm số và kế hoạch GPA
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAuthDialogOpen(true)}
            className="h-8.5 text-xs font-bold rounded-xl border-border hover:bg-muted/60 gap-1.5"
          >
            <School className="w-3.5 h-3.5 text-brand" />
            <span>Đăng nhập Cổng Khảo thí</span>
          </Button>

          <AnimatePresence>
            {hasEdits && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetEdits}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8.5 px-3 font-bold text-xs rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Đặt lại
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 h-8.5 shadow-xs font-bold text-xs rounded-xl px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm môn dự kiến
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <DashboardStats stats={overallStats} />

      {/* GPA Trend & Goal Planner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: GPA Goal Planner */}
        <GoalPlanner
          grades={grades}
          currentGpa4={overallStats.gpa4}
          totalCredits={overallStats.credits}
        />

        {/* Right: GPA Trend Chart */}
        <div className="bg-card rounded-2xl border border-border shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand" />
            <h3 className="font-extrabold text-sm text-foreground">
              Biểu đồ xu hướng GPA tích lũy
            </h3>
          </div>

          {gpaTrendData.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gpaTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gpaChartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#635BFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#635BFF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={10} tickLine={false} />
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
                    fill="url(#gpaChartGrad)"
                    name="GPA Tích lũy"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <p>Chưa có dữ liệu bảng điểm.</p>
            </div>
          )}
        </div>
      </div>

      {/* Semester Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            Bảng điểm theo từng học kỳ ({semesters.length} học kỳ)
          </h2>
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Chạm vào điểm để chỉnh sửa hoặc thử kịch bản điểm
          </span>
        </div>

        <div className="space-y-4">
          {semesters.map((sem, idx) => (
            <SemesterCard
              key={sem.id}
              semesterId={sem.id}
              grades={sem.grades}
              gpaScale={gpaScale}
              onUpdate={updateGrade}
              onDelete={deleteGrade}
              index={idx}
            />
          ))}

          {semesters.length === 0 && (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl p-6 shadow-xs">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-primary">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">Chưa có bảng điểm</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
                Đăng nhập Cổng Khảo thí để tự động đồng bộ bảng điểm cá nhân, hoặc thêm môn học dự kiến để tính điểm.
              </p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                size="sm"
                className="mt-5 font-bold text-xs h-9 px-5 gap-1.5 shadow-xs bg-primary text-primary-foreground rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm môn dự kiến
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Planned Subject Dialog */}
      <AddSubjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        subjects={subjects}
        existingSemesters={existingSemesters}
        onAdd={addPlannedSubject}
      />

      {/* Cổng Khảo thí Login Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        hasCookie={hasCookie}
        isLive={isLive}
        onSave={saveCredentials}
        onClear={clearCredentials}
      />
    </div>
  );
}

export default GpaPage;
