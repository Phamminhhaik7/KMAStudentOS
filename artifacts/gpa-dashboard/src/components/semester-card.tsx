import { memo, useMemo, useState } from "react";
import { Grade, GradesResponseGpaScale } from "@workspace/api-client-react";
import { calculateGpa, isPhysicalEducation, isRetakePrevious } from "@/lib/utils";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GradeRow } from "./grade-row";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SemesterCardProps {
  semesterId: string;
  grades: Grade[];
  allGrades?: Grade[];
  gpaScale: GradesResponseGpaScale;
  onUpdate: (stt: string, field: keyof Grade, value: string) => void;
  onDelete: (stt: string) => void;
  index: number;
}

export const SemesterCard = memo(({ semesterId, grades, allGrades = [], gpaScale, onUpdate, onDelete, index }: SemesterCardProps) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const { year, term } = grades[0] || { year: "", term: "" };
  
  const effectiveAllGrades = allGrades.length > 0 ? allGrades : grades;
  const stats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);
  const plannedCount = grades.filter(g => g.stt.startsWith('planned_') || g.course === '-').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden mb-5 transition-all hover:shadow-sm"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-card hover:bg-muted/30 cursor-pointer transition-colors border-b border-transparent data-[state=open]:border-border/80">
            <div className="flex items-center gap-3.5 mb-3 sm:mb-0">
              <div className="bg-primary text-primary-foreground w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs">
                <span className="text-[9px] leading-tight uppercase opacity-80 font-semibold tracking-wider">Kỳ</span>
                <span className="text-base leading-none mt-0.5">{term}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">Học kỳ {term}</h3>
                  {plannedCount > 0 && (
                    <Badge variant="secondary" className="text-[10.5px] font-semibold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {plannedCount} môn đang học
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono font-medium">Năm học {year}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 flex-1">
              <div className="flex gap-4 sm:gap-8 text-xs sm:text-sm">
                <div className="text-left">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Tín chỉ</p>
                  <p className="font-mono font-extrabold text-sm sm:text-base text-foreground">{stats.credits}</p>
                </div>
                <div className="text-left">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Hệ 10</p>
                  <p className="font-mono font-extrabold text-sm sm:text-base text-foreground">{stats.credits > 0 ? stats.gpa10.toFixed(2) : "-"}</p>
                </div>
                <div className="text-left">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Hệ 4</p>
                  <p className="font-mono font-black text-primary text-base sm:text-lg leading-none">{stats.credits > 0 ? stats.gpa4.toFixed(2) : "-"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8.5 w-8.5 text-muted-foreground hover:bg-muted/70 shrink-0 rounded-lg">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {plannedCount > 0 && (
            <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>Các môn học từ Thời khóa biểu đang diễn ra (chưa có điểm thi). Bạn có thể bấm vào ô điểm bất kỳ để nhập điểm dự kiến và xem GPA mô phỏng.</span>
            </div>
          )}

          {/* Desktop Table View (sm+) */}
          <div className="hidden sm:block overflow-x-auto p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border/80 text-xs">
                  <TableHead className="w-20 font-bold text-xs">Mã HP</TableHead>
                  <TableHead className="font-bold text-xs">Môn học</TableHead>
                  <TableHead className="text-center w-14 font-bold text-xs">TC</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Thành phần 1 (10%)">TP1</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Thành phần 2 (10%)">TP2</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Điểm quá trình (30%)">ĐQT</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Điểm thi (70%)">Thi</TableHead>
                  <TableHead className="text-center w-20 font-bold text-xs text-foreground">Tổng kết</TableHead>
                  <TableHead className="text-center w-14 font-bold text-xs text-primary">Chữ</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map(grade => (
                  <GradeRow 
                    key={grade.stt}
                    grade={grade}
                    allGrades={effectiveAllGrades}
                    gpaScale={gpaScale}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View (< sm) */}
          <div className="sm:hidden p-3 space-y-3 bg-muted/20">
            {grades.map(grade => {
              const isPE = isPhysicalEducation(grade.subject);
              const isRetakePrev = isRetakePrevious(grade, effectiveAllGrades);
              const isExcluded = isPE || isRetakePrev;
              return (
                <div 
                  key={grade.stt} 
                  className={`p-3.5 bg-card border border-border/80 rounded-xl space-y-2.5 shadow-2xs ${
                    isExcluded ? 'opacity-70 grayscale-[0.3]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10.5px] font-mono font-bold text-muted-foreground">{grade.code}</span>
                      <h4 className="font-bold text-xs text-foreground leading-snug">{grade.subject}</h4>
                      {isPE && (
                        <div className="text-[9.5px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3"/> Không tính GPA
                        </div>
                      )}
                      {!isPE && isRetakePrev && (
                        <div className="text-[9.5px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3"/> Thi lại - Không tính GPA
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2 py-0.5">
                        {grade.letter || '-'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(grade.stt)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Score Inputs Grid for Mobile */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1 text-center">
                    <div className="bg-muted/50 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">TC</p>
                      <p className="font-mono font-bold text-xs mt-0.5">{grade.credits}</p>
                    </div>
                    <div className="bg-muted/50 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">TP1</p>
                      <input
                        type="text"
                        value={grade.tp1 === '-' ? '' : grade.tp1}
                        onChange={(e) => onUpdate(grade.stt, 'tp1', e.target.value)}
                        placeholder="-"
                        className="w-full text-center font-mono font-bold text-xs bg-card border border-border rounded mt-0.5 py-0.5"
                      />
                    </div>
                    <div className="bg-muted/50 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">TP2</p>
                      <input
                        type="text"
                        value={grade.tp2 === '-' ? '' : grade.tp2}
                        onChange={(e) => onUpdate(grade.stt, 'tp2', e.target.value)}
                        placeholder="-"
                        className="w-full text-center font-mono font-bold text-xs bg-card border border-border rounded mt-0.5 py-0.5"
                      />
                    </div>
                    <div className="bg-muted/50 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">ĐQT</p>
                      <input
                        type="text"
                        value={grade.dqt === '-' ? '' : grade.dqt}
                        onChange={(e) => onUpdate(grade.stt, 'dqt', e.target.value)}
                        placeholder="-"
                        className="w-full text-center font-mono font-bold text-xs bg-card border border-border rounded mt-0.5 py-0.5"
                      />
                    </div>
                    <div className="bg-muted/50 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase">Thi</p>
                      <input
                        type="text"
                        value={grade.exam === '-' ? '' : grade.exam}
                        onChange={(e) => onUpdate(grade.stt, 'exam', e.target.value)}
                        placeholder="-"
                        className="w-full text-center font-mono font-bold text-xs bg-card border border-border rounded mt-0.5 py-0.5"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {plannedCount > 0 && (
            <div className="bg-muted/60 text-muted-foreground text-xs px-4 py-2.5 border-t border-border flex items-center gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-[11px]">
                Bao gồm {plannedCount} môn dự kiến. Việc tính toán GPA đã bao gồm các chỉnh sửa hiện tại.
              </span>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
});