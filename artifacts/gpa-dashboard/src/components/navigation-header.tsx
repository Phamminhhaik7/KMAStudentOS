import { Link, useLocation } from 'wouter';
import { GraduationCap, Calendar, School, RefreshCw, Server, Loader2 } from 'lucide-react';
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
  portalTitle = 'Đăng nhập',
  courseCount,
  onSyncData,
  isSyncing = false,
}: NavigationHeaderProps) {
  const [location] = useLocation();

  const isGpaActive = location === '/' || location === '';
  const isScheduleActive = location.startsWith('/schedule');

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Student Info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <Link href="/">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </Link>
          <div className="min-w-0">
            <h1 className="font-extrabold text-foreground leading-tight tracking-tight text-xs sm:text-sm md:text-base truncate">
              KMA Student
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
              {studentName ? (
                <span className="font-bold text-foreground/90 max-w-[90px] xs:max-w-[130px] sm:max-w-[200px] truncate">
                  {studentName}
                </span>
              ) : (
                <span className="truncate text-muted-foreground">Chưa đăng nhập</span>
              )}
              {isLive !== undefined && (
                <span
                  className={`flex items-center gap-0.5 font-bold text-[9.5px] sm:text-[10.5px] ${
                    isLive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <span className="hidden xs:inline">{isLive ? 'Online' : 'Offline'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Loket Pill Style) */}
        <nav className="flex items-center bg-muted/80 p-0.5 sm:p-1 rounded-xl border border-border/70 shrink-0">
          <Link href="/">
            <button
              type="button"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 ${
                isGpaActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>GPA</span>
            </button>
          </Link>

          <Link href="/schedule">
            <button
              type="button"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer active:scale-95 ${
                isScheduleActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Lịch</span>
              {courseCount !== undefined && courseCount > 0 && (
                <span
                  className={`px-1.5 py-0 text-[10px] font-mono font-bold rounded-md ml-0.5 ${
                    isScheduleActive ? 'bg-white/20 text-white' : 'bg-background text-foreground'
                  }`}
                >
                  {courseCount}
                </span>
              )}
            </button>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {onSyncData && (
            <Button
              onClick={onSyncData}
              disabled={isSyncing}
              size="sm"
              className="h-8 sm:h-9 gap-1 px-2 sm:px-3 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              title="Đồng bộ dữ liệu"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Đồng bộ</span>
            </Button>
          )}

          {onOpenPortalSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPortalSettings}
              className="h-8 sm:h-9 gap-1 px-2 sm:px-2.5 shadow-2xs hover:bg-card border-border text-xs font-bold rounded-xl active:scale-95 transition-all"
              title={portalTitle}
            >
              <School className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">{portalTitle}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
