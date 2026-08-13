import { GpaStats } from "@/lib/utils";
import { BookOpen, GraduationCap, Calculator } from "lucide-react";

export function DashboardStats({ stats }: { stats: GpaStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-card border border-card-border p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform duration-500 group-hover:scale-110">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Hệ 10</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-mono font-bold text-foreground tracking-tight">{stats.gpa10.toFixed(2)}</h2>
            <span className="text-sm text-muted-foreground font-mono font-medium">/ 10.0</span>
          </div>
        </div>
      </div>

      <div className="bg-primary border border-primary p-6 rounded-2xl shadow-md flex items-center gap-5 relative overflow-hidden text-primary-foreground group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 transition-transform group-hover:scale-110 duration-700 pointer-events-none blur-2xl" />
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 relative z-10 backdrop-blur-md border border-white/10 transition-transform duration-500 group-hover:scale-110">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="relative z-10 flex-1">
          <p className="text-xs font-bold text-primary-foreground/80 uppercase tracking-widest mb-1.5">Hệ 4</p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-mono font-bold text-white tracking-tight">{stats.gpa4.toFixed(2)}</h2>
              <span className="text-sm text-primary-foreground/70 font-mono font-medium">/ 4.0</span>
            </div>
            <p className="text-xs font-bold mt-2 bg-white/15 backdrop-blur-sm border border-white/10 inline-flex px-3 py-1 rounded-full w-fit tracking-wide shadow-sm">
              {stats.classification}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border p-6 rounded-2xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md hover:border-primary/20 group">
        <div className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Tổng tín chỉ</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-mono font-bold text-foreground tracking-tight">{stats.credits}</h2>
            <span className="text-sm text-muted-foreground font-medium">tích lũy</span>
          </div>
        </div>
      </div>
    </div>
  );
}