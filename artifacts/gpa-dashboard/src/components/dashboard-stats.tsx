import { GpaStats } from "@/lib/utils";
import { BookOpen, GraduationCap, Calculator } from "lucide-react";

export function DashboardStats({ stats }: { stats: GpaStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-card border border-card-border p-5 rounded-xl shadow-sm flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cumulative GPA (10)</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-mono font-bold text-foreground">{stats.gpa10.toFixed(2)}</h2>
            <span className="text-xs text-muted-foreground font-mono">/ 10.0</span>
          </div>
        </div>
      </div>

      <div className="bg-primary border border-primary-border p-5 rounded-xl shadow-md flex items-center gap-5 relative overflow-hidden text-primary-foreground group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110 duration-500 pointer-events-none" />
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 relative z-10">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wider mb-1">Cumulative GPA (4)</p>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-mono font-bold text-white">{stats.gpa4.toFixed(2)}</h2>
              <span className="text-xs text-primary-foreground/70 font-mono">/ 4.0</span>
            </div>
            <p className="text-xs font-semibold mt-1 bg-white/20 inline-block px-2 py-0.5 rounded-full w-fit">
              {stats.classification}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border p-5 rounded-xl shadow-sm flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Credits</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-mono font-bold text-foreground">{stats.credits}</h2>
            <span className="text-xs text-muted-foreground font-mono">earned</span>
          </div>
        </div>
      </div>
    </div>
  );
}