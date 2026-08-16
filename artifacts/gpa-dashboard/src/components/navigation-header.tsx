import { Link, useLocation } from 'wouter';
import { GraduationCap, Calendar, School, RefreshCw, Server, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavigationHeaderProps {
  studentName?: string;
  studentId?: string;
  isLive?: boolean;
  onOpenPortalSettings?: () => void;
  portalTitle?: string;
  courseCount?: number;
  onSyncData?: () => void;
  isSyncing?: boolean;
}

export function NavigationHeader({
  studentName,
  studentId,
  isLive,
  onOpenPortalSettings,
  portalTitle = 'Đăng nhập Cổng',
  courseCount,
  onSyncData,
  isSyncing = false,
}: NavigationHeaderProps) {
  const [location] = useLocation();

  const isGpaActive = location === '/' || location === '';
  const isScheduleActive = location.startsWith('/schedule');

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Student Info */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
              <GraduationCap className="w-5 h-5" />
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-foreground leading-tight hidden sm:block tracking-tight text-sm md:text-base">
                KMA Student Gateway
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
              {studentName ? (
                <span className="font-semibold text-foreground/90 max-w-[160px] sm:max-w-none truncate">
                  {studentName} {studentId ? `(${studentId})` : ''}
                </span>
              ) : (
                <span>Đã lưu vào bộ nhớ máy</span>
              )}
              {isLive !== undefined && (
                <>
                  <span className="hidden sm:inline opacity-40">•</span>
                  <span
                    className={`hidden sm:flex items-center gap-1 font-semibold text-[11px] ${
                      isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary/80'
                    }`}
                  >
                    {isLive ? <Server className="w-3 h-3 text-emerald-500" /> : <Server className="w-3 h-3 text-muted-foreground" />}
                    {isLive ? 'Trực tuyến' : 'Đã lưu cục bộ'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60">
          <Link href="/">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                isGpaActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Bảng điểm & GPA</span>
            </button>
          </Link>

          <Link href="/schedule">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                isScheduleActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4 text-primary" />
              <span>Lịch học</span>
              {courseCount !== undefined && courseCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-bold h-4">
                  {courseCount}
                </Badge>
              )}
            </button>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* NÚT ĐỒNG BỘ DỮ LIỆU */}
          {onSyncData && (
            <Button
              onClick={onSyncData}
              disabled={isSyncing}
              size="sm"
              className="h-9 gap-1.5 px-3 sm:px-4 shadow-sm bg-primary text-primary-foreground hover:opacity-90 font-semibold text-xs rounded-xl"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Đồng bộ dữ liệu</span>
              <span className="sm:hidden">Đồng bộ</span>
            </Button>
          )}

          {/* Nút Đăng nhập / Cài đặt cổng */}
          {onOpenPortalSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPortalSettings}
              className="h-9 gap-1.5 px-2.5 sm:px-3 shadow-2xs hover:bg-muted/50 border-border text-xs font-semibold rounded-xl"
            >
              <School className="w-4 h-4 text-primary" />
              <span className="hidden md:inline">{portalTitle}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
