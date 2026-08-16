import { GpaStats } from "@/lib/utils";
import { BookOpen, GraduationCap, Calculator, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DashboardStats({ stats }: { stats: GpaStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
      {/* GPA Hệ 10 Card */}
      <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs flex items-center justify-between gap-4 transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">GPA Hệ 10</p>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-3xl sm:text-4xl font-mono font-extrabold text-foreground tracking-tight">
              {stats.gpa10.toFixed(2)}
            </h2>
            <span className="text-xs text-muted-foreground font-mono font-medium">/ 10.0</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Điểm trung bình tích lũy</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center text-foreground shrink-0 border border-border/60">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* GPA Hệ 4 Hero Card (Loket Obsidian Primary) */}
      <div className="bg-primary text-primary-foreground border border-primary p-5 sm:p-6 rounded-2xl shadow-sm flex items-center justify-between gap-4 relative overflow-hidden transition-all hover:shadow-md">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-wider">GPA Hệ 4</p>
            <span className="text-[10px] bg-white/20 font-bold px-1.5 py-0.2 rounded text-white">Chính</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
              {stats.gpa4.toFixed(2)}
            </h2>
            <span className="text-xs text-primary-foreground/70 font-mono font-medium">/ 4.0</span>
          </div>
          <Badge className="bg-white text-primary hover:bg-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs border-none">
            {stats.classification}
          </Badge>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 z-10">
          <GraduationCap className="w-6 h-6" />
        </div>
      </div>

      {/* Total Credits Card */}
      <div className="bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs flex items-center justify-between gap-4 transition-all hover:shadow-sm">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tín chỉ tích lũy</p>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-3xl sm:text-4xl font-mono font-extrabold text-foreground tracking-tight">
              {stats.credits}
            </h2>
            <span className="text-xs text-muted-foreground font-medium">tín chỉ</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Đã hoàn thành</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center text-foreground shrink-0 border border-border/60">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}