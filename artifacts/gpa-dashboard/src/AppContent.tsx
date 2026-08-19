import { useMemo, useState } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { calculateGpa } from '@/lib/utils';
import { AuthDialog } from '@/components/cookie-dialog';
import { DashboardStats } from '@/components/dashboard-stats';
import { GoalPlanner } from '@/components/goal-planner';
import { SemesterCard } from '@/components/semester-card';
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RotateCcw, BookOpen } from 'lucide-react';
import { Grade } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { NavigationHeader } from '@/components/navigation-header';

function AppContent() {
  const { toast } = useToast();
  const { 
    grades, subjects, gpaScale, userInfo, isLive, isLoading, hasCookie, hasEdits, refetch,
    saveCredentials, clearCredentials, updateGrade, deleteGrade, addPlannedSubject, resetEdits
  } = useGpaData();

  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncGpa = async () => {
    setIsSyncing(true);
    try {
      const res = await refetch();
      if (res.data?.isLive && res.data.grades.length > 0) {
        toast({
          title: 'Đồng bộ điểm thi thành công! 🎉',
          description: `Đã cập nhật bảng điểm mới nhất (${res.data.grades.length} môn học).`,
        });
      } else if (!hasCookie || !res.data?.isLive) {
        toast({
          variant: 'destructive',
          title: 'Phiên đăng nhập Khảo thí đã hết hạn',
          description: 'Vui lòng đăng nhập hoặc cập nhật Cookie để đồng bộ bảng điểm mới.',
        });
        setCookieDialogOpen(true);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đồng bộ',
        description: err?.message || 'Không thể kết nối đến Cổng Khảo thí.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

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
      <NavigationHeader
        studentName={userInfo?.name}
        studentId={userInfo?.id}
        isLive={isLive}
        portalTitle="Đăng nhập Khảo thí"
        onOpenPortalSettings={() => setCookieDialogOpen(true)}
        onSyncData={handleSyncGpa}
        isSyncing={isSyncing}
      />

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8">
        <DashboardStats stats={overallStats} />
        
        <div className="mb-8 sm:mb-10">
          <GoalPlanner 
            grades={grades} 
            currentGpa4={overallStats.gpa4} 
            totalCredits={overallStats.credits} 
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Chi tiết học kỳ & Bảng điểm</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Nhấp vào điểm trong bảng để chỉnh sửa hoặc dự phóng điểm số.</p>
          </div>
          <div className="flex gap-2.5 items-center w-full sm:w-auto">
            <AnimatePresence>
              {hasEdits && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Button variant="ghost" size="sm" onClick={resetEdits} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8.5 px-3 font-bold text-xs rounded-xl">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Đặt lại
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Button size="sm" onClick={() => setAddDialogOpen(true)} className="bg-primary text-primary-foreground hover:opacity-90 h-8.5 shadow-xs flex-1 sm:flex-none font-bold text-xs rounded-xl px-4">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Thêm môn dự kiến
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {semesters.map((sem, idx) => (
            <SemesterCard 
              key={sem.id}
              semesterId={sem.id}
              grades={sem.grades}
              allGrades={grades}
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
              <Button onClick={() => setCookieDialogOpen(true)} size="sm" className="mt-5 font-bold text-xs h-9 px-5 gap-1.5 shadow-xs bg-primary text-primary-foreground rounded-xl">
                Đồng bộ Bảng Điểm
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