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
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Student Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
          <Link href="/">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer">
              <GraduationCap className="w-5 h-5" />
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-foreground leading-tight tracking-tight text-xs sm:text-sm md:text-base truncate">
                KMA Student
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mt-0.5">
              {studentName ? (
                <span className="font-semibold text-foreground/90 max-w-[120px] sm:max-w-[200px] truncate">
                  {studentName}
                </span>
              ) : (
                <span className="truncate">Cục bộ (Offline)</span>
              )}
              {isLive !== undefined && (
                <>
                  <span className="hidden sm:inline opacity-30">•</span>
                  <span
                    className={`hidden sm:flex items-center gap-1 font-semibold text-[10.5px] ${
                      isLive ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                    }`}
                  >
                    <Server className={`w-3 h-3 ${isLive ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    {isLive ? 'Online' : 'Offline'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Loket Pill Style) */}
        <nav className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/70 shrink-0">
          <Link href="/">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                isGpaActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">GPA & Điểm</span>
              <span className="xs:hidden sm:hidden">GPA</span>
            </button>
          </Link>

          <Link href="/schedule">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                isScheduleActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch học</span>
              {courseCount !== undefined && courseCount > 0 && (
                <Badge
                  variant={isScheduleActive ? "secondary" : "outline"}
                  className={`px-1.5 py-0 text-[10px] font-bold h-4 ml-0.5 ${
                    isScheduleActive ? 'bg-white/20 text-white border-transparent' : 'bg-background'
                  }`}
                >
                  {courseCount}
                </Badge>
              )}
            </button>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onSyncData && (
            <Button
              onClick={onSyncData}
              disabled={isSyncing}
              size="sm"
              className="h-8.5 sm:h-9 gap-1.5 px-2.5 sm:px-3.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
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
              className="h-8.5 sm:h-9 gap-1.5 px-2.5 sm:px-3 shadow-2xs hover:bg-card border-border text-xs font-bold rounded-xl active:scale-95 transition-all"
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
