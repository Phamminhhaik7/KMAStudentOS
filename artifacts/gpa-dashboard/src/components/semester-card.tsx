import { memo, useMemo, useState } from "react";
import { Grade, GradesResponseGpaScale } from "@workspace/api-client-react";
import { calculateGpa } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GradeRow } from "./grade-row";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SemesterCardProps {
  semesterId: string; // e.g., "2023_1"
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden mb-6"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-card hover:bg-muted/30 cursor-pointer transition-colors border-b border-transparent data-[state=open]:border-border">
            <div className="flex items-center gap-3 mb-3 sm:mb-0">
              <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold">
                <span className="text-[10px] leading-tight uppercase opacity-80">Term</span>
                <span className="leading-none">{term}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Học kỳ {term}</h3>
                <p className="text-sm text-muted-foreground font-mono">Năm học {year}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 flex-1">
              <div className="flex gap-4 sm:gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">Credits</p>
                  <p className="font-mono font-medium">{stats.credits}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">GPA 10</p>
                  <p className="font-mono font-medium text-foreground">{stats.gpa10.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">GPA 4</p>
                  <p className="font-mono font-bold text-primary text-base leading-tight">{stats.gpa4.toFixed(2)}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="overflow-x-auto p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-16">Code</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center w-16">CR</TableHead>
                  <TableHead className="text-center w-16" title="Thành phần 1 (10%)">TP1</TableHead>
                  <TableHead className="text-center w-16" title="Thành phần 2 (10%)">TP2</TableHead>
                  <TableHead className="text-center w-16" title="Điểm quá trình (30%)">ĐQT</TableHead>
                  <TableHead className="text-center w-16" title="Điểm thi (70%)">Thi</TableHead>
                  <TableHead className="text-center w-20">Tổng kết</TableHead>
                  <TableHead className="text-center w-16">Chữ</TableHead>
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
            <div className="bg-amber-500/5 text-amber-700 text-xs px-4 py-2 border-t border-amber-500/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Includes {plannedCount} planned/ungraded subject{plannedCount > 1 ? 's' : ''}. GPA computations include active edits.
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
});