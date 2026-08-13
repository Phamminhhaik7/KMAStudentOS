import { useState, useMemo } from 'react';
import { Target, Trophy, ArrowRight, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Grade } from '@workspace/api-client-react';
import { isPhysicalEducation } from '@/lib/utils';
import { motion } from 'framer-motion';

export function GoalPlanner({ grades, currentGpa4, totalCredits }: { grades: Grade[], currentGpa4: number, totalCredits: number }) {
  const [target, setTarget] = useState<string>('3.2');

  const { remainingCredits, result } = useMemo(() => {
    const pending = grades.filter(g => 
      !isPhysicalEducation(g.subject) && 
      (!g.course || g.course === '-' || g.stt.startsWith('planned_'))
    );
    
    const remCredits = pending.reduce((acc, g) => acc + g.credits, 0);
    
    if (!target) return { remainingCredits: remCredits, result: null };
    
    const t = parseFloat(target);
    if (isNaN(t) || t <= 0 || t > 4.0) return { remainingCredits: remCredits, result: null };

    if (remCredits === 0) {
      if (currentGpa4 >= t) {
        return { remainingCredits: remCredits, result: { type: 'achieved', msg: "Bạn đã đạt được mục tiêu này!" } };
      }
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: "Không còn tín chỉ nào để cải thiện GPA." } };
    }

    const requiredTotalPoints = t * (totalCredits + remCredits);
    const currentPoints = currentGpa4 * totalCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    const neededAvg = neededPoints / remCredits;

    if (neededAvg > 4.0) {
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: `Không thể đạt được. Bạn cần trung bình ${neededAvg.toFixed(2)}.` } };
    }
    
    if (neededAvg <= 0) {
      return { remainingCredits: remCredits, result: { type: 'achieved', msg: "Bạn đang vượt tiến độ để đạt mục tiêu này." } };
    }

    return { 
      remainingCredits: remCredits, 
      result: { 
        type: 'possible', 
        msg: `Bạn cần đạt trung bình ${neededAvg.toFixed(2)} cho ${remCredits} tín chỉ dự kiến/chưa có điểm còn lại.` 
      } 
    };
  }, [grades, currentGpa4, totalCredits, target]);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-primary/20 group">
      <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
        <Target className="w-64 h-64 text-primary" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-base font-bold text-primary flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5" />
          Kế hoạch GPA
        </h3>
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-xl border border-border shadow-sm">
            <label className="text-sm font-semibold text-foreground whitespace-nowrap">Mục tiêu Hệ 4:</label>
            <Input 
              type="number" 
              step="0.01"
              min="0"
              max="4.0"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-24 font-mono font-bold text-primary bg-muted/50 border-none shadow-none text-lg h-9"
            />
          </div>
          
          <div className="hidden md:flex text-muted-foreground/50">
            <ArrowRight className="w-5 h-5" />
          </div>
          
          <div className="flex-1 w-full">
            {remainingCredits === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-4 py-3 rounded-xl border border-border/50">
                <XCircle className="w-4 h-4 text-muted-foreground/70" /> Thêm môn dự kiến bên dưới để tính toán.
              </p>
            ) : result ? (
              <motion.div 
                key={result.type}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-medium p-4 rounded-xl flex items-center gap-4 border shadow-sm ${
                  result.type === 'achieved' ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20' :
                  result.type === 'impossible' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  'bg-background text-foreground border-border'
                }`}
              >
                {result.type === 'possible' ? (
                  <>
                    <div className="flex flex-col items-center justify-center bg-primary/10 text-primary w-14 h-12 rounded-lg shrink-0 border border-primary/10">
                      <span className="font-mono font-bold text-xl leading-none">
                        {result.msg.match(/([0-9.]+)/)?.[1] || ''}
                      </span>
                    </div>
                    <span className="leading-relaxed text-muted-foreground">điểm trung bình cần thiết cho <strong className="text-foreground">{remainingCredits} tín chỉ</strong> chưa có điểm.</span>
                  </>
                ) : (
                  <span className="leading-tight">{result.msg}</span>
                )}
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}