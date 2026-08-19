import { memo, useState, useEffect, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";
import type { Grade, GradesResponseGpaScale } from "@workspace/api-client-react";
import { isPhysicalEducation, isRetakePrevious } from "@/lib/utils";

interface GradeRowProps {
  grade: Grade;
  allGrades?: Grade[];
  gpaScale: GradesResponseGpaScale;
  onUpdate: (stt: string, field: keyof Grade, value: string) => void;
  onDelete: (stt: string) => void;
}

const EditableCell = memo(({ 
  value, 
  onChange,
  type = "text",
  className = ""
}: { 
  value: string;
  onChange: (val: string) => void;
  type?: "text" | "number";
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setVal(value);
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (val !== value) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setVal(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={val === "-" ? "" : val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={`w-full max-w-[60px] h-8 px-1.5 text-center text-sm font-mono font-medium bg-background border-2 border-primary/40 rounded focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 ${className}`}
        placeholder="-"
      />
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-muted/70 rounded px-1.5 py-1.5 text-center transition-colors min-h-[32px] flex items-center justify-center font-mono ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
});

export const GradeRow = memo(({ grade, allGrades = [], gpaScale, onUpdate, onDelete }: GradeRowProps) => {
  const isPE = isPhysicalEducation(grade.subject);
  const isRetakePrev = isRetakePrevious(grade, allGrades);
  const isExcluded = isPE || isRetakePrev;

  return (
    <TableRow className={`group transition-colors hover:bg-muted/30 ${isExcluded ? "opacity-60 grayscale-[0.5]" : ""}`}>
      <TableCell className="font-mono text-xs text-muted-foreground w-16">{grade.code}</TableCell>
      <TableCell className="max-w-[200px] font-medium">
        <div className="truncate text-foreground/90" title={grade.subject}>{grade.subject}</div>
        {isPE && (
          <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-1 bg-muted w-fit px-1.5 py-0.5 rounded">
            <AlertCircle className="w-3 h-3"/> Không tính GPA
          </div>
        )}
        {!isPE && isRetakePrev && (
          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1 bg-amber-500/10 border border-amber-500/20 w-fit px-1.5 py-0.5 rounded">
            <AlertCircle className="w-3 h-3"/> Thi lại - Không tính GPA
          </div>
        )}
      </TableCell>
      <TableCell className="text-center font-mono font-medium">{grade.credits}</TableCell>
      <TableCell>
        <EditableCell value={grade.tp1} onChange={(v) => onUpdate(grade.stt, 'tp1', v)} />
      </TableCell>
      <TableCell>
        <EditableCell value={grade.tp2} onChange={(v) => onUpdate(grade.stt, 'tp2', v)} />
      </TableCell>
      <TableCell>
        <EditableCell value={grade.dqt} onChange={(v) => onUpdate(grade.stt, 'dqt', v)} />
      </TableCell>
      <TableCell>
        <EditableCell value={grade.exam} onChange={(v) => onUpdate(grade.stt, 'exam', v)} />
      </TableCell>
      <TableCell className="font-bold">
        <EditableCell 
          value={grade.course} 
          onChange={(v) => onUpdate(grade.stt, 'course', v)} 
          className="bg-primary/5 text-primary rounded"
        />
      </TableCell>
      <TableCell className="text-center font-bold text-primary font-mono text-base">
        {grade.letter}
      </TableCell>
      <TableCell className="text-right w-12">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
          onClick={() => onDelete(grade.stt)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});