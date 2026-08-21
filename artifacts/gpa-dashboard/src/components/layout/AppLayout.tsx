import { useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickAddDialog } from '@/components/quick-add-dialog';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useTimetable } from '@/hooks/use-timetable';
import { useTasks } from '@/hooks/use-tasks';
import { useExams } from '@/hooks/use-exams';
import { useToast } from '@/hooks/use-toast';
import { AuthDialog } from '@/components/cookie-dialog';
import { QldtLoginDialog } from '@/components/qldt-login-dialog';
import { AddSubjectDialog } from '@/components/add-subject-dialog';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const {
    userInfo,
    isLive: isGpaLive,
    hasCookie: hasGpaCookie,
    saveCredentials,
    clearCredentials,
    refetch: refetchGpa,
    subjects,
    grades,
    addPlannedSubject,
  } = useGpaData();

  const {
    timetable,
    hasCookie: hasTimetableCookie,
    login: loginQldt,
    saveCookieDirectly: saveQldtCookie,
    logout: logoutQldt,
    syncTimetable,
  } = useTimetable();

  const { tasks } = useTasks();
  const { exams } = useExams();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [gpaAuthOpen, setGpaAuthOpen] = useState(false);
  const [qldtAuthOpen, setQldtAuthOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const studentName = userInfo?.name || timetable?.studentName;
  const studentId = userInfo?.id || timetable?.studentId;
  const isLive = isGpaLive || timetable?.isLive;

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    try {
      // 1. If currently on GPA page (/gpa)
      if (location === '/gpa') {
        const gpaRes = await refetchGpa();
        if (gpaRes.data?.isLive && gpaRes.data.grades.length > 0) {
          toast({
            title: 'Đồng bộ điểm thi Khảo thí thành công! 🎉',
            description: `Đã cập nhật bảng điểm mới nhất (${gpaRes.data.grades.length} môn học).`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Phiên đăng nhập Khảo thí đã hết hạn',
            description: 'Vui lòng đăng nhập hoặc cập nhật Cookie để đồng bộ bảng điểm mới.',
          });
          setGpaAuthOpen(true);
        }
        return;
      }

      // 2. If currently on Schedule page (/schedule)
      if (location.startsWith('/schedule')) {
        const timetableRes = await syncTimetable();
        if (timetableRes.success) {
          toast({
            title: 'Đồng bộ thời khóa biểu thành công! 🎉',
            description: timetableRes.reauthenticated
              ? 'Đã tự động đăng nhập lại bằng tài khoản đã lưu và cập nhật lịch học mới nhất.'
              : 'Thời khóa biểu của bạn đã được cập nhật mới nhất từ Cổng QLĐT.',
          });
        } else if (timetableRes.requireLogin) {
          toast({
            variant: 'destructive',
            title: 'Phiên đăng nhập QLĐT đã hết hạn',
            description: timetableRes.error || 'Tài khoản hoặc mật khẩu đã lưu không chính xác. Vui lòng đăng nhập lại.',
          });
          setQldtAuthOpen(true);
        } else {
          toast({
            variant: 'destructive',
            title: 'Lỗi đồng bộ',
            description: timetableRes.error || 'Không thể kết nối đến Cổng QLĐT.',
          });
        }
        return;
      }

      // 3. For other pages (Dashboard, Settings, etc.): Sync both
      const gpaPromise = refetchGpa();
      const timetablePromise = syncTimetable();
      const [gpaRes, timetableRes] = await Promise.all([gpaPromise, timetablePromise]);

      if (timetableRes.success && gpaRes.data?.isLive) {
        toast({
          title: 'Đồng bộ toàn bộ thành công! 🎉',
          description: 'Thời khóa biểu và bảng điểm KMA đã được làm mới.',
        });
      } else if (timetableRes.success) {
        toast({
          title: 'Đồng bộ lịch học thành công! 🎉',
          description: 'Lịch học đã được cập nhật. Cổng Khảo thí chưa kết nối.',
        });
      } else if (gpaRes.data?.isLive) {
        toast({
          title: 'Đồng bộ điểm thi thành công! 🎉',
          description: 'Bảng điểm đã được cập nhật. Cổng QLĐT chưa kết nối.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Phiên đăng nhập hết hạn',
          description: 'Vui lòng đăng nhập lại để cập nhật dữ liệu trực tuyến.',
        });
        if (timetableRes.requireLogin) {
          setQldtAuthOpen(true);
        } else {
          setGpaAuthOpen(true);
        }
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đồng bộ',
        description: err?.message || 'Không thể kết nối đến máy chủ nhà trường.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const existingSemesters = grades.map((g) => ({ year: g.year, term: g.term }));

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          studentName={studentName}
          studentId={studentId}
          isLive={isLive}
          courseCount={timetable?.courses?.length}
          taskCount={tasks.filter((t) => t.status !== 'done').length}
          examCount={exams.length}
        />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <AppHeader
          studentName={studentName}
          studentId={studentId}
          isLive={isLive}
          onSyncData={handleGlobalSync}
          isSyncing={isSyncing}
          onOpenGpaLogin={() => setGpaAuthOpen(true)}
          onOpenQldtLogin={() => setQldtAuthOpen(true)}
          onOpenQuickAdd={() => setQuickAddOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenQuickAdd={() => setQuickAddOpen(true)}
        courseCount={timetable?.courses?.length}
        taskCount={tasks.filter((t) => t.status !== 'done').length}
      />

      {/* Modals */}
      <QuickAddDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onOpenAddSubject={() => setAddSubjectOpen(true)}
      />

      <AddSubjectDialog
        open={addSubjectOpen}
        onOpenChange={setAddSubjectOpen}
        subjects={subjects}
        existingSemesters={existingSemesters}
        onAdd={addPlannedSubject}
      />

      <AuthDialog
        open={gpaAuthOpen}
        onOpenChange={setGpaAuthOpen}
        hasCookie={hasGpaCookie}
        isLive={isGpaLive}
        onSave={saveCredentials}
        onClear={clearCredentials}
      />

      <QldtLoginDialog
        open={qldtAuthOpen}
        onOpenChange={setQldtAuthOpen}
        hasCookie={hasTimetableCookie}
        isLive={timetable?.isLive || false}
        studentInfo={timetable?.studentInfo}
        onLogin={loginQldt}
        onSaveCookie={saveQldtCookie}
        onLogout={logoutQldt}
      />
    </div>
  );
}
