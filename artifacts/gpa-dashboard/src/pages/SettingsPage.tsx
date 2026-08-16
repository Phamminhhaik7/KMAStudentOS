import { useState } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useTimetable } from '@/hooks/use-timetable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  RefreshCw,
  School,
  Database,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Server,
  User,
  Shield,
  Loader2,
  Github,
  Mail,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Heart,
  Code2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QldtLoginDialog } from '@/components/qldt-login-dialog';
import { AuthDialog } from '@/components/cookie-dialog';

export function SettingsPage() {
  const { toast } = useToast();
  const {
    userInfo,
    isLive: isGpaLive,
    hasCookie: hasGpaCookie,
    saveCredentials: saveGpaCredentials,
    clearCredentials: clearGpaCredentials,
    refetch: refetchGpa,
    grades,
  } = useGpaData();

  const {
    timetable,
    hasCookie: hasTimetableCookie,
    login: loginQldt,
    saveCookieDirectly: saveQldtCookie,
    logout: logoutQldt,
    syncTimetable,
  } = useTimetable();

  const [isSyncing, setIsSyncing] = useState(false);
  const [qldtDialogOpen, setQldtDialogOpen] = useState(false);
  const [gpaDialogOpen, setGpaDialogOpen] = useState(false);

  const studentName = userInfo?.name || timetable?.studentName || 'Phạm Minh Hải';
  const studentId = userInfo?.id || timetable?.studentId || 'Chưa cập nhật';

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const gpaPromise = refetchGpa();
      const timetablePromise = syncTimetable();
      const [gpaRes, timetableRes] = await Promise.all([gpaPromise, timetablePromise]);

      if (timetableRes.success || gpaRes.data?.isLive) {
        toast({
          title: 'Đồng bộ toàn bộ thành công! 🎉',
          description: 'Thời khóa biểu và bảng điểm KMA đã được làm mới.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Cần đăng nhập Cổng',
          description: 'Vui lòng đăng nhập lại để cập nhật dữ liệu trực tuyến.',
        });
        setQldtDialogOpen(true);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Lỗi đồng bộ',
        description: err?.message || 'Không thể kết nối máy chủ nhà trường.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm cục bộ không?')) {
      localStorage.removeItem('actvn_qldt_credentials');
      localStorage.removeItem('actvn_qldt_cached_timetable');
      localStorage.removeItem('kma_academic_tasks_v2');
      localStorage.removeItem('kma_academic_exams_v2');
      localStorage.removeItem('kma_academic_notifications_v2');
      toast({
        title: 'Đã xóa bộ nhớ đệm thành công',
        description: 'Tải lại trang để áp dụng.',
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Cài đặt & Trung tâm Hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Quản lý kết nối Cổng Đào tạo (QLĐT), Khảo thí, thông tin tác giả và dữ liệu
          </p>
        </div>
      </div>

      {/* Developer & Contact Card (Tác giả & Liên hệ) */}
      <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-primary/20 shrink-0">
              MH
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-foreground">
                  Phạm Minh Hải
                </h3>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10.5px] px-2 py-0.5 rounded-md">
                  Developer
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sinh viên Học viện Kỹ thuật Mật mã • KMA CT10 - CNTT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Phamminhhaik7"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs font-bold gap-1.5 rounded-xl border-border hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Button>
            </a>
          </div>
        </div>

        {/* Contact Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="mailto:minhhai.kma@gmail.com"
            className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Email liên hệ</p>
              <p className="text-xs font-bold text-foreground truncate">minhhai.kma@gmail.com</p>
            </div>
          </a>

          <a
            href="https://github.com/Phamminhhaik7/Web-Gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Mã nguồn dự án</p>
              <p className="text-xs font-bold text-foreground truncate">Web-Gateway Repository</p>
            </div>
          </a>

          <a
            href="https://github.com/Phamminhhaik7/Web-Gateway/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground font-medium">Góp ý & Báo lỗi</p>
              <p className="text-xs font-bold text-foreground truncate">Gửi phản hồi / Issues</p>
            </div>
          </a>
        </div>

        {/* Project Badge */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>Phát triển vì cộng đồng sinh viên Học viện Kỹ thuật Mật mã (KMA)</span>
          </div>
          <span className="font-mono font-bold text-foreground/80">KMA Student OS v2.2.0</span>
        </div>
      </Card>

      {/* Sync Status Hub */}
      <Card className="border-border bg-card rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-base text-foreground">
              Trạng thái Đồng bộ Cổng Trường
            </h3>
          </div>

          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            size="sm"
            className="bg-primary text-primary-foreground font-bold text-xs h-8.5 rounded-xl px-3.5 shadow-xs hover:opacity-90 transition-all cursor-pointer"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Đồng bộ ngay
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {/* Service 1: Cổng QLĐT */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground">Cổng QLĐT (Thời khóa biểu)</span>
                <span className={`w-2 h-2 rounded-full ${timetable?.isLive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">qldt.actvn.edu.vn</p>
              <p className="text-[11px] text-muted-foreground mt-2">
                {timetable?.courses ? `Đã đồng bộ ${timetable.courses.length} học phần` : 'Chưa có dữ liệu'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQldtDialogOpen(true)}
              className="text-xs h-8 rounded-lg font-bold border-border"
            >
              Cấu hình
            </Button>
          </div>

          {/* Service 2: Cổng Khảo thí */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground">Cổng Khảo thí (Bảng điểm)</span>
                <span className={`w-2 h-2 rounded-full ${isGpaLive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">khaothi.actvn.edu.vn</p>
              <p className="text-[11px] text-muted-foreground mt-2">
                {grades ? `Đã đồng bộ ${grades.length} môn học` : 'Chưa có dữ liệu'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGpaDialogOpen(true)}
              className="text-xs h-8 rounded-lg font-bold border-border"
            >
              Cấu hình
            </Button>
          </div>
        </div>
      </Card>

      {/* Student Profile Card */}
      <Card className="border-border bg-card rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-extrabold text-base text-foreground">
            Thông tin Tài khoản Đăng nhập
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Họ và tên</p>
            <p className="font-bold text-sm text-foreground">{studentName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Mã sinh viên (MSSV)</p>
            <p className="font-bold text-sm text-foreground">{studentId}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Học viện</p>
            <p className="font-bold text-xs text-foreground">Học viện Kỹ thuật Mật mã (KMA)</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Bảo mật & Quyền riêng tư</p>
            <p className="font-bold text-xs text-emerald-600 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Lưu trữ an toàn trên thiết bị (LocalStorage)
            </p>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h3 className="font-extrabold text-sm text-destructive">
            Xóa dữ liệu bộ nhớ đệm cục bộ
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Xóa toàn bộ token phiên đăng nhập đã lưu, danh sách bài tập và lịch thi offline trên trình duyệt này.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearCache}
          className="font-bold text-xs h-8.5 rounded-xl px-4"
        >
          Xóa toàn bộ Cache
        </Button>
      </Card>

      {/* Dialogs */}
      <QldtLoginDialog
        open={qldtDialogOpen}
        onOpenChange={setQldtDialogOpen}
        hasCookie={hasTimetableCookie}
        isLive={timetable?.isLive || false}
        studentInfo={timetable?.studentInfo}
        onLogin={loginQldt}
        onSaveCookie={saveQldtCookie}
        onLogout={logoutQldt}
      />

      <AuthDialog
        open={gpaDialogOpen}
        onOpenChange={setGpaDialogOpen}
        hasCookie={hasGpaCookie}
        isLive={isGpaLive}
        onSave={saveGpaCredentials}
        onClear={clearGpaCredentials}
      />
    </div>
  );
}

export default SettingsPage;
