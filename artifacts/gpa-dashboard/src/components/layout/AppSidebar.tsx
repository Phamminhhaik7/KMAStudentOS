import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  GraduationCap,
  CheckSquare,
  FileText,
  BarChart3,
  Award,
  Settings,
  RefreshCw,
  Server,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  studentName?: string;
  studentId?: string;
  isLive?: boolean;
  courseCount?: number;
  taskCount?: number;
  examCount?: number;
}

export function AppSidebar({
  studentName,
  studentId,
  isLive,
  courseCount,
  taskCount,
  examCount,
}: AppSidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      label: 'Tổng quan',
      href: '/',
      icon: LayoutDashboard,
      active: location === '/' || location === '',
    },
    {
      label: 'Lịch học',
      href: '/schedule',
      icon: Calendar,
      active: location.startsWith('/schedule'),
      badge: courseCount ? `${courseCount}` : undefined,
    },
    {
      label: 'Môn học',
      href: '/courses',
      icon: BookOpen,
      active: location.startsWith('/courses'),
    },
    {
      label: 'GPA & Điểm',
      href: '/gpa',
      icon: GraduationCap,
      active: location.startsWith('/gpa'),
    },
    {
      label: 'Công việc',
      href: '/tasks',
      icon: CheckSquare,
      active: location.startsWith('/tasks'),
      badge: taskCount ? `${taskCount}` : undefined,
    },
    {
      label: 'Thi cử',
      href: '/exams',
      icon: FileText,
      active: location.startsWith('/exams'),
      badge: examCount ? `${examCount}` : undefined,
    },
    {
      label: 'Thống kê',
      href: '/analytics',
      icon: BarChart3,
      active: location.startsWith('/analytics'),
    },
    {
      label: 'Tiến độ',
      href: '/degree',
      icon: Award,
      active: location.startsWith('/degree'),
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border/70">
          <img
            src="/kma-logo.png"
            alt="KMA Logo"
            className="w-9 h-9 object-contain drop-shadow-xs"
          />
          <div className="min-w-0">
            <h2 className="font-black text-foreground text-sm leading-tight tracking-tight flex items-center gap-1.5">
              KMA Student
            </h2>
            <p className="text-[10.5px] font-mono text-muted-foreground truncate">
              Academic Dashboard
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1.5 pt-1">
            Điều hướng
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                    item.active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${item.active ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                        item.active
                          ? 'bg-white/20 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile & Settings */}
      <div className="p-3 border-t border-border/70 space-y-1">
        <Link href="/settings">
          <button
            type="button"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              location.startsWith('/settings')
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Cài đặt & Đồng bộ</span>
            </div>
            {isLive !== undefined && (
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            )}
          </button>
        </Link>

        {/* User Mini Card */}
        <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2.5 mt-1">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
            {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-xs text-foreground truncate leading-tight">
              {studentName || 'Sinh viên KMA'}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {studentId || 'Chưa đăng nhập'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
