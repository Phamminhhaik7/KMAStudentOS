import { useMemo, useState } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { calculateGpa } from '@/lib/utils';
import { AuthDialog } from '@/components/cookie-dialog';
import { DashboardStats } from '@/components/dashboard-stats';
import { GoalPlanner } from '@/components/goal-planner';
import { SemesterCard } from '@/components/semester-card';
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RotateCcw, Settings, Server, RefreshCw, BookOpen, GraduationCap } from 'lucide-react';
import { Grade } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { 
    grades, subjects, gpaScale, userInfo, isLive, isLoading, hasCookie, hasEdits,
    saveCredentials, clearCredentials, updateGrade, deleteGrade, addPlannedSubject, resetEdits
  } = useGpaData();

  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const semesters = useMemo(() => {
    const map = new Map<string, Grade[]>();
    grades.forEach(g => {
      const key = `${g.year}|${g.term}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });

    return Array.from(map.entries()).sort((a, b) => {
      const [yA, tA] = a[0].split('|');
      const [yB, tB] = b[0].split('|');
      if (yA !== yB) return yB.localeCompare(yA);
      return tB.localeCompare(tA);
    }).map(([id, grades]) => ({ id, grades }));
  }, [grades]);

  const existingSemesters = useMemo(() => {
    return semesters.map(s => {
      const [y, t] = s.id.split('|');
      return { year: y, term: t };
    });
  }, [semesters]);

  const overallStats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);

  if (isLoading && grades.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-5" />
        <p className="font-mono text-sm text-muted-foreground animate-pulse font-medium tracking-wide">Đang tải dữ liệu học tập...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight hidden sm:block tracking-tight">Hệ thống Quản lý Học tập</h1>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                {userInfo ? (
                  <span className="font-semibold text-foreground/80">{userInfo.name} ({userInfo.id})</span>
                ) : (
                  <span>Khách</span>
                )}
                <span className="hidden sm:inline opacity-50">•</span>
                <span className={`flex items-center gap-1.5 font-semibold ${isLive ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isLive ? <Server className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                  {isLive ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCookieDialogOpen(true)} className="h-9 gap-2 px-4 shadow-sm hover:bg-muted/50 border-border">
              <Settings className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline font-semibold">Đồng bộ cổng thông tin</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-10">
        <DashboardStats stats={overallStats} />
        
        <div className="mb-12">
          <GoalPlanner 
            grades={grades} 
            currentGpa4={overallStats.gpa4} 
            totalCredits={overallStats.credits} 
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Chi tiết học kỳ</h2>
            <p className="text-sm text-muted-foreground/80 font-medium">Nhấn vào điểm trong bảng để chỉnh sửa. Hệ thống tự động tính toán lại.</p>
          </div>
          <div className="flex gap-3 items-center w-full md:w-auto">
            <AnimatePresence>
              {hasEdits && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Button variant="ghost" size="sm" onClick={resetEdits} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 font-semibold">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Đặt lại chỉnh sửa
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Button size="sm" onClick={() => setAddDialogOpen(true)} className="bg-foreground text-background hover:bg-foreground/90 h-9 shadow-md flex-1 md:flex-none font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Thêm môn dự kiến
            </Button>
          </div>
        </div>

        <div className="space-y-6">
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
            <div className="text-center py-24 bg-muted/20 border border-dashed rounded-2xl">
              <div className="w-16 h-16 bg-muted border border-border/50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-muted-foreground/50">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground/80">Chưa có điểm</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                Đăng nhập để đồng bộ dữ liệu thực tế từ hệ thống, hoặc thêm môn học dự kiến để bắt đầu tính toán điểm số.
              </p>
              <Button onClick={() => setCookieDialogOpen(true)} variant="outline" className="mt-6 shadow-sm font-semibold">
                Đồng bộ ngay
              </Button>
            </div>
          )}
        </div>
      </main>

      <AuthDialog 
        open={cookieDialogOpen} 
        onOpenChange={setCookieDialogOpen}
        hasCookie={hasCookie}
        isLive={isLive}
        onSave={saveCredentials}
        onClear={clearCredentials}
      />
      
      <AddSubjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        subjects={subjects}
        existingSemesters={existingSemesters}
        onAdd={addPlannedSubject}
      />
    </div>
  );
}

export default AppContent;