import { useState, useMemo } from 'react';
import { Target, Trophy, ArrowRight, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Grade } from '@workspace/api-client-react';
import { isPhysicalEducation } from '@/lib/utils';
import { motion } from 'framer-motion';

export function GoalPlanner({ grades, currentGpa4, totalCredits }: { grades: Grade[], currentGpa4: number, totalCredits: number }) {
  const [target, setTarget] = useState<string>('3.2');

  const { remainingCredits, result } = useMemo(() => {
    // Ungraded / planned subjects (no final course score or letter)
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
        return { remainingCredits: remCredits, result: { type: 'achieved', msg: "You've already hit this target!" } };
      }
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: "No credits remaining to improve GPA." } };
    }

    // Formula: Target = (CurrentGPA * CurrentCredits + NeededAvg * RemCredits) / (CurrentCredits + RemCredits)
    // NeededAvg = (Target * (CurrentCredits + RemCredits) - CurrentGPA * CurrentCredits) / RemCredits
    
    // Actually, currentGpa4 and totalCredits above already include all subjects with valid grades.
    // However, if some 'planned_' subjects have grades, they are already in totalCredits.
    // The `pending` calculation above checks for missing `course`. So totalCredits is strictly "credits with grades".
    
    const requiredTotalPoints = t * (totalCredits + remCredits);
    const currentPoints = currentGpa4 * totalCredits;
    const neededPoints = requiredTotalPoints - currentPoints;
    const neededAvg = neededPoints / remCredits;

    if (neededAvg > 4.0) {
      return { remainingCredits: remCredits, result: { type: 'impossible', msg: `Mathematically impossible. You'd need a ${neededAvg.toFixed(2)} average.` } };
    }
    
    if (neededAvg <= 0) {
      return { remainingCredits: remCredits, result: { type: 'achieved', msg: "You're already above track to hit this." } };
    }

    return { 
      remainingCredits: remCredits, 
      result: { 
        type: 'possible', 
        msg: `You need to average ${neededAvg.toFixed(2)} across your ${remCredits} remaining planned/ungraded credits.` 
      } 
    };
  }, [grades, currentGpa4, totalCredits, target]);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Target className="w-32 h-32 text-primary" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5" />
          Goal Planner
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-foreground whitespace-nowrap">Target 4.0 GPA:</label>
            <Input 
              type="number" 
              step="0.01"
              min="0"
              max="4.0"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-24 font-mono font-bold text-primary bg-background border-primary/30"
            />
          </div>
          
          <div className="hidden sm:block text-muted-foreground">
            <ArrowRight className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            {remainingCredits === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Add planned subjects below to forecast goals.
              </p>
            ) : result ? (
              <motion.div 
                key={result.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm font-medium p-3 rounded-lg flex items-start gap-3 border ${
                  result.type === 'achieved' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' :
                  result.type === 'impossible' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  'bg-background text-foreground border-border shadow-sm'
                }`}
              >
                {result.type === 'possible' ? (
                  <span className="font-mono text-primary text-2xl leading-none mt-0.5 block">
                    {result.msg.match(/([0-9.]+)/)?.[1] || ''}
                  </span>
                ) : null}
                <span className="leading-tight mt-0.5">{result.msg}</span>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}