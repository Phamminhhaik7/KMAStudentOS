import { useMemo, useState } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { calculateGpa } from '@/lib/utils';
import { CookieDialog } from '@/components/cookie-dialog';
import { DashboardStats } from '@/components/dashboard-stats';
import { GoalPlanner } from '@/components/goal-planner';
import { SemesterCard } from '@/components/semester-card';
import { AddSubjectDialog } from '@/components/add-subject-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RotateCcw, Settings, Server, RefreshCw, BookOpen } from 'lucide-react';
import { Grade } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';

function AppContent() {
  const { 
    grades, subjects, gpaScale, userInfo, isLive, isLoading, hasCookie, hasEdits,
    saveCredentials, clearCredentials, updateGrade, deleteGrade, addPlannedSubject, resetEdits
  } = useGpaData();

  const [cookieDialogOpen, setCookieDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Group grades by semester
  const semesters = useMemo(() => {
    const map = new Map<string, Grade[]>();
    grades.forEach(g => {
      const key = `${g.year}|${g.term}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });

    return Array.from(map.entries()).sort((a, b) => {
      // Sort descending (newest first)
      const [yA, tA] = a[0].split('|');
      const [yB, tB] = b[0].split('|');
      if (yA !== yB) return yB.localeCompare(yA);
      return tB.localeCompare(tA);
    }).map(([id, grades]) => ({ id, grades }));
  }, [grades]);

  const existingSemesters = useMemo(() => {
    return semesters.map(s => {
      const [y, t] = s.id.split('|');
      return { year: y, term: t };
    });
  }, [semesters]);

  const overallStats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);

  if (isLoading && grades.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="font-mono text-sm text-muted-foreground animate-pulse">Loading academy records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono">
              ACT
            </div>
            <div>
              <h1 className="font-bold text-foreground leading-tight hidden sm:block">Command Center</h1>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                {userInfo ? (
                  <span className="font-semibold text-foreground/80">{userInfo.name} ({userInfo.id})</span>
                ) : (
                  <span>Guest User</span>
                )}
                <span className="hidden sm:inline opacity-50">•</span>
                <span className={`flex items-center gap-1 ${isLive ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isLive ? <Server className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                  {isLive ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCookieDialogOpen(true)} className="h-8 gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Sync Portal</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <DashboardStats stats={overallStats} />
        
        <div className="mb-10">
          <GoalPlanner 
            grades={grades} 
            currentGpa4={overallStats.gpa4} 
            totalCredits={overallStats.credits} 
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Semester Breakdown</h2>
            <p className="text-sm text-muted-foreground">Click values in tables to inline-edit scores. Auto-saves locally.</p>
          </div>
          <div className="flex gap-3 items-center">
            <AnimatePresence>
              {hasEdits && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <Button variant="ghost" size="sm" onClick={resetEdits} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Edits
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <Button size="sm" onClick={() => setAddDialogOpen(true)} className="bg-foreground text-background hover:bg-foreground/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Planned Subject
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {semesters.map((sem, idx) => (
            <SemesterCard 
              key={sem.id}
              semesterId={sem.id}
              grades={sem.grades}
              gpaScale={gpaScale}
              onUpdate={updateGrade}
              onDelete={deleteGrade}
              index={idx}
            />
          ))}
          
          {semesters.length === 0 && (
            <div className="text-center py-20 bg-muted/30 border border-dashed rounded-xl">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-1">No grades found</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Paste your portal cookie to sync real data, or add planned subjects manually to start forecasting.
              </p>
            </div>
          )}
        </div>
      </main>

      <CookieDialog 
        open={cookieDialogOpen} 
        onOpenChange={setCookieDialogOpen}
        hasCookie={hasCookie}
        isLive={isLive}
        onSave={saveCredentials}
        onClear={clearCredentials}
      />
      
      <AddSubjectDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        subjects={subjects}
        existingSemesters={existingSemesters}
        onAdd={addPlannedSubject}
      />
    </div>
  );
}

export default AppContent;