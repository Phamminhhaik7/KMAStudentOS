import { memo, useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";
import type { Grade, GradesResponseGpaScale } from "@workspace/api-client-react";
import { isPhysicalEducation } from "@/lib/utils";

interface GradeRowProps {
  grade: Grade;
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
        className={`w-full max-w-[60px] h-7 px-1.5 text-center text-sm bg-background border border-primary/40 rounded focus:outline-none focus:ring-2 focus:ring-primary/30 ${className}`}
        placeholder="-"
      />
    );
  }

  return (
    <div 
      className={`cursor-pointer hover:bg-muted/50 rounded px-1.5 py-1 text-center transition-colors min-h-[28px] flex items-center justify-center ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
});

export const GradeRow = memo(({ grade, gpaScale, onUpdate, onDelete }: GradeRowProps) => {
  const isPE = isPhysicalEducation(grade.subject);

  return (
    <TableRow className={`group ${isPE ? "opacity-60" : ""}`}>
      <TableCell className="font-mono text-xs text-muted-foreground w-16">{grade.code}</TableCell>
      <TableCell className="max-w-[200px]">
        <div className="font-medium truncate" title={grade.subject}>{grade.subject}</div>
        {isPE && <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3"/> Excluded from GPA</div>}
      </TableCell>
      <TableCell className="text-center">{grade.credits}</TableCell>
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
      <TableCell className="font-semibold">
        <EditableCell 
          value={grade.course} 
          onChange={(v) => onUpdate(grade.stt, 'course', v)} 
          className="bg-primary/5 text-primary rounded"
        />
      </TableCell>
      <TableCell className="text-center font-bold text-primary">
        {grade.letter}
      </TableCell>
      <TableCell className="text-right w-12">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(grade.stt)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});