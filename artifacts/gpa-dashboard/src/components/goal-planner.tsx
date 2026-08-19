import { useState, useMemo } from 'react';
import { Target, Trophy, ArrowRight, XCircle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Grade } from '@workspace/api-client-react';
import { isPhysicalEducation, isRetakePrevious } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export function GoalPlanner({ grades, currentGpa4, totalCredits }: { grades: Grade[], currentGpa4: number, totalCredits: number }) {
  const [target, setTarget] = useState<string>('3.2');

  const { remainingCredits, result } = useMemo(() => {
    const pending = grades.filter(g => 
      !isPhysicalEducation(g.subject) && 
      !isRetakePrevious(g, grades) &&
      (!g.course || g.course === '-' || g.stt.startsWith('planned_'))
    );
    
    const remCredits = pending.reduce((acc, g) => acc + g.credits, 0);
    
    if (!target) return { remainingCredits: remCredits, result: null };
    
    const t = parseFloat(target);
    if (isNaN(t) || t <= 0 || t > 4.0) return { remainingCredits: remCredits, result: null };

    if (remCredits === 0) {
      if (currentGpa4 >= t) {
        return { remainingCredits: remCredits, result: { type: 'achieved', msg: "Bạn đã đạt được mục tiêu này! 🎉" } };
      }
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: "Không còn tín chỉ nào để cải thiện GPA." } };
    }

    const requiredTotalPoints = t * (totalCredits + remCredits);
    const currentPoints = currentGpa4 * totalCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    const neededAvg = neededPoints / remCredits;

    if (neededAvg > 4.0) {
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: `Không thể đạt được. Bạn cần đạt trung bình ${neededAvg.toFixed(2)}/4.0.` } };
    }
    
    if (neededAvg <= 0) {
      return { remainingCredits: remCredits, result: { type: 'achieved', msg: "Bạn đang vượt tiến độ để đạt mục tiêu này." } };
    }

    return { 
      remainingCredits: remCredits, 
      result: { 
        type: 'possible', 
        neededAvg: neededAvg.toFixed(2),
        msg: `Bạn cần đạt trung bình ${neededAvg.toFixed(2)} cho ${remCredits} tín chỉ dự kiến còn lại.` 
      } 
    };
  }, [grades, currentGpa4, totalCredits, target]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2 tracking-tight">
          <Trophy className="w-4 h-4 text-primary" />
          Kế hoạch & Dự phóng Mục tiêu GPA
        </h3>
        <Badge variant="outline" className="text-[10.5px] font-bold font-mono">
          Hệ 4.0
        </Badge>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex items-center justify-between gap-3 bg-muted/60 px-4 py-2.5 rounded-xl border border-border/80 shrink-0">
          <label className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">Mục tiêu Hệ 4:</label>
          <Input 
            type="number" 
            step="0.05"
            min="0"
            max="4.0"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-20 font-mono font-black text-foreground bg-card border border-border text-center text-base h-8.5 rounded-lg shadow-2xs"
          />
        </div>
        
        <div className="hidden md:flex text-muted-foreground/40 shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {remainingCredits === 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/40 px-3.5 py-2.5 rounded-xl border border-border/60">
              <XCircle className="w-4 h-4 text-muted-foreground/70 shrink-0" />
              <span>Thêm các môn dự kiến để hệ thống tự động tính toán điểm mục tiêu.</span>
            </p>
          ) : result ? (
            <motion.div 
              key={result.type}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs font-medium p-3.5 rounded-xl flex items-center gap-3.5 border shadow-2xs ${
                result.type === 'achieved' ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20' :
                result.type === 'impossible' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                'bg-muted/40 text-foreground border-border'
              }`}
            >
              {result.type === 'possible' ? (
                <>
                  <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground w-12 h-10 rounded-lg shrink-0 font-bold shadow-2xs">
                    <span className="font-mono text-base font-black leading-none">
                      {result.neededAvg}
                    </span>
                  </div>
                  <span className="leading-snug text-muted-foreground text-xs">
                    Điểm trung bình học phần cần đạt cho <strong className="text-foreground font-bold">{remainingCredits} tín chỉ</strong> còn lại.
                  </span>
                </>
              ) : (
                <span className="leading-snug font-semibold">{result.msg}</span>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}