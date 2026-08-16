import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notification-center';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, School, Loader2, Plus, GraduationCap, Calendar, ChevronDown } from 'lucide-react';

interface AppHeaderProps {
  studentName?: string;
  studentId?: string;
  isLive?: boolean;
  onSyncData?: () => void;
  isSyncing?: boolean;
  onOpenGpaLogin?: () => void;
  onOpenQldtLogin?: () => void;
  onOpenQuickAdd?: () => void;
}

export function AppHeader({
  studentName,
  studentId,
  isLive,
  onSyncData,
  isSyncing,
  onOpenGpaLogin,
  onOpenQldtLogin,
  onOpenQuickAdd,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/80 h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Mobile Logo Brand (visible on mobile only since desktop has sidebar) */}
      <div className="flex md:hidden items-center gap-2.5 min-w-0">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/kma-logo.png" alt="KMA Logo" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-foreground text-sm tracking-tight truncate">
              KMA Student
            </span>
          </div>
        </Link>
      </div>

      {/* Desktop Search / Breadcrumb greeting */}
      <div className="hidden md:flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
        {isLive !== undefined && (
          <span
            className={`flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full border ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            <span>{isLive ? 'Đã kết nối Cổng' : 'Offline'}</span>
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Desktop Quick Add Button */}
        {onOpenQuickAdd && (
          <Button
            onClick={onOpenQuickAdd}
            size="sm"
            className="hidden sm:flex h-8.5 font-bold text-xs gap-1.5 rounded-xl px-3 bg-primary text-primary-foreground shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nhanh</span>
          </Button>
        )}

        {/* Sync Button */}
        {onSyncData && (
          <Button
            onClick={onSyncData}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="h-8.5 font-bold text-xs gap-1.5 rounded-xl px-2.5 sm:px-3 border-border hover:bg-card shadow-2xs active:scale-95 transition-all cursor-pointer"
            title="Đồng bộ dữ liệu"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">Đồng bộ</span>
          </Button>
        )}

        {/* Portal Login Dropdown (Khảo thí vs QLĐT) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8.5 font-bold text-xs gap-1.5 rounded-xl px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-primary" />
              <span className="hidden lg:inline">Đăng nhập Cổng</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 bg-card border border-border shadow-xl">
            <DropdownMenuLabel className="text-[10.5px] font-bold text-muted-foreground uppercase px-2 py-1">
              Chọn Cổng Trường
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onOpenGpaLogin}
              className="rounded-xl px-2.5 py-2 text-xs font-bold gap-2 cursor-pointer focus:bg-muted"
            >
              <GraduationCap className="w-4 h-4 text-brand" />
              <div>
                <p className="font-extrabold text-foreground">Cổng Khảo thí</p>
                <p className="text-[10px] text-muted-foreground font-normal">Đồng bộ Bảng điểm & GPA</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onOpenQldtLogin}
              className="rounded-xl px-2.5 py-2 text-xs font-bold gap-2 cursor-pointer focus:bg-muted"
            >
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="font-extrabold text-foreground">Cổng QLĐT</p>
                <p className="text-[10px] text-muted-foreground font-normal">Thời khóa biểu & Phòng học</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notification Center Popover */}
        <NotificationCenter />
      </div>
    </header>
  );
}
