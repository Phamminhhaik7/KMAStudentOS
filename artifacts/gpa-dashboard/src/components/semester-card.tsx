import { memo, useMemo, useState } from "react";
import { Grade, GradesResponseGpaScale } from "@workspace/api-client-react";
import { calculateGpa } from "@/lib/utils";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GradeRow } from "./grade-row";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SemesterCardProps {
  semesterId: string;
  grades: Grade[];
  gpaScale: GradesResponseGpaScale;
  onUpdate: (stt: string, field: keyof Grade, value: string) => void;
  onDelete: (stt: string) => void;
  index: number;
}

export const SemesterCard = memo(({ semesterId, grades, gpaScale, onUpdate, onDelete, index }: SemesterCardProps) => {
  const [isOpen, setIsOpen] = useState(index === 0);
  const { year, term } = grades[0] || { year: "", term: "" };
  
  const stats = useMemo(() => calculateGpa(grades, gpaScale), [grades, gpaScale]);
  const plannedCount = grades.filter(g => g.stt.startsWith('planned_') || g.course === '-').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="bg-card border border-card-border rounded-2xl shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:shadow-md"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 bg-card hover:bg-muted/30 cursor-pointer transition-colors border-b border-transparent data-[state=open]:border-border/60">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0">
                <span className="text-[10px] leading-tight uppercase opacity-80 font-semibold tracking-wider">Kỳ</span>
                <span className="text-lg leading-none mt-0.5">{term}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground tracking-tight">Học kỳ {term}</h3>
                <p className="text-sm text-muted-foreground font-medium">Năm học {year}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 flex-1">
              <div className="flex gap-6 sm:gap-10 text-sm">
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Tín chỉ</p>
                  <p className="font-mono font-bold text-base">{stats.credits}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Hệ 10</p>
                  <p className="font-mono font-bold text-base text-foreground/80">{stats.gpa10.toFixed(2)}</p>
                </div>
                <div className="text-center sm:text-left relative">
                  <div className="absolute -inset-2 bg-primary/5 rounded-lg -z-10 blur-sm"></div>
                  <p className="text-primary/70 text-[10px] uppercase font-bold tracking-widest mb-1">Hệ 4</p>
                  <p className="font-mono font-black text-primary text-xl leading-none">{stats.gpa4.toFixed(2)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-muted/50 shrink-0">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="overflow-x-auto p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-20 font-bold text-xs">Mã HP</TableHead>
                  <TableHead className="font-bold text-xs">Môn học</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs">TC</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Thành phần 1 (10%)">TP1</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Thành phần 2 (10%)">TP2</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Điểm quá trình (30%)">ĐQT</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs" title="Điểm thi (70%)">Thi</TableHead>
                  <TableHead className="text-center w-24 font-bold text-xs text-primary">Tổng kết</TableHead>
                  <TableHead className="text-center w-16 font-bold text-xs text-primary">Chữ</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map(grade => (
                  <GradeRow 
                    key={grade.stt}
                    grade={grade}
                    gpaScale={gpaScale}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {plannedCount > 0 && (
            <div className="bg-amber-50 text-amber-800 text-xs px-5 py-3 border-t border-amber-100 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-medium">
                Bao gồm {plannedCount} môn dự kiến/chưa có điểm. Việc tính toán GPA đã bao gồm các chỉnh sửa hiện tại.
              </span>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
});