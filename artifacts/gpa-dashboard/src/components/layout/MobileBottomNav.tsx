import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Plus,
  Menu,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  Award,
  Settings,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
  courseCount?: number;
  taskCount?: number;
}

export function MobileBottomNav({ onOpenQuickAdd, courseCount, taskCount }: MobileBottomNavProps) {
  const [location] = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isHomeActive = location === '/' || location === '';
  const isScheduleActive = location.startsWith('/schedule');
  const isTasksActive = location.startsWith('/tasks');

  const moreItems = [
    { label: 'Môn học', href: '/courses', icon: BookOpen },
    { label: 'GPA & Điểm', href: '/gpa', icon: GraduationCap },
    { label: 'Thi cử', href: '/exams', icon: FileText },
    { label: 'Thống kê', href: '/analytics', icon: BarChart3 },
    { label: 'Tiến độ tốt nghiệp', href: '/degree', icon: Award },
    { label: 'Cài đặt & Đồng bộ', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <Link href="/">
          <button
            type="button"
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
              isHomeActive
                ? 'text-foreground font-black'
                : 'text-muted-foreground hover:text-foreground font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg ${isHomeActive ? 'bg-muted' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5">Tổng quan</span>
          </button>
        </Link>

        {/* Schedule */}
        <Link href="/schedule">
          <button
            type="button"
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl relative transition-all ${
              isScheduleActive
                ? 'text-foreground font-black'
                : 'text-muted-foreground hover:text-foreground font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${isScheduleActive ? 'bg-muted' : ''}`}>
              <Calendar className="w-5 h-5" />
              {courseCount !== undefined && courseCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand text-brand-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                  {courseCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Lịch học</span>
          </button>
        </Link>

        {/* Quick Add Button (+) */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-95 active:scale-90 transition-all cursor-pointer shrink-0 -mt-3 ring-4 ring-background"
          title="Thêm nhanh"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Tasks */}
        <Link href="/tasks">
          <button
            type="button"
            className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl relative transition-all ${
              isTasksActive
                ? 'text-foreground font-black'
                : 'text-muted-foreground hover:text-foreground font-semibold'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${isTasksActive ? 'bg-muted' : ''}`}>
              <CheckSquare className="w-5 h-5" />
              {taskCount !== undefined && taskCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning text-primary-foreground rounded-full text-[9px] font-bold flex items-center justify-center">
                  {taskCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Công việc</span>
          </button>
        </Link>

        {/* More Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-muted-foreground hover:text-foreground font-semibold"
            >
              <div className="p-1">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">Khác</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-border bg-card p-5 max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left pb-3 border-b border-border/70 mb-3">
              <div className="flex items-center gap-2.5">
                <img src="/kma-logo.png" alt="KMA Logo" className="w-7 h-7 object-contain" />
                <SheetTitle className="text-base font-extrabold text-foreground">
                  KMA Student OS
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2.5 py-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      type="button"
                      onClick={() => setSheetOpen(false)}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs border-primary'
                          : 'bg-muted/40 text-foreground border-border/80 hover:bg-muted font-semibold'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
