import { useState, useMemo } from 'react';
import { Subject } from '@workspace/api-client-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { removeAccents } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, BookOpen, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  existingSemesters: { year: string, term: string }[];
  onAdd: (subject: Subject, term: string, year: string, examStr?: string, courseStr?: string) => void;
}

export function AddSubjectDialog({ open, onOpenChange, subjects, existingSemesters, onAdd }: AddSubjectDialogProps) {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [term, setTerm] = useState('1');
  const [year, setYear] = useState('');
  const [exam, setExam] = useState('');
  const [course, setCourse] = useState('');
  const [comboOpen, setComboOpen] = useState(false);

  const semesterOptions = useMemo(() => {
    const years = new Set(existingSemesters.map(s => s.year));
    let latestYearStart = 2023;
    
    if (years.size > 0) {
      const sorted = Array.from(years).sort();
      const latest = sorted[sorted.length - 1]; 
      if (latest) {
        latestYearStart = parseInt(latest.split('-')[0], 10);
      }
    }

    const options: { year: string, term: string, label: string }[] = [];
    
    const existing = new Set<string>();
    existingSemesters.forEach(s => {
      const key = `${s.year}|${s.term}`;
      if (!existing.has(key)) {
        existing.add(key);
        options.push({ year: s.year, term: s.term, label: `Học kỳ ${s.term} (${s.year})` });
      }
    });

    for (let i = 0; i < 3; i++) {
      const yStr = `${latestYearStart + i}-${latestYearStart + i + 1}`;
      for (const t of ['1', '2', '3']) {
        const key = `${yStr}|${t}`;
        if (!existing.has(key)) {
          options.push({ year: yStr, term: t, label: `Học kỳ ${t} (${yStr}) - Dự kiến` });
        }
      }
    }

    return options.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      return a.term.localeCompare(b.term);
    });
  }, [existingSemesters]);

  useMemo(() => {
    if (open && semesterOptions.length > 0 && !year) {
      setYear(semesterOptions[semesterOptions.length - 1].year);
      setTerm(semesterOptions[semesterOptions.length - 1].term);
    }
  }, [open, semesterOptions, year]);

  const handleSave = () => {
    if (selectedSubject && year && term) {
      onAdd(selectedSubject, term, year, exam, course);
      setSelectedSubject(null);
      setExam('');
      setCourse('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-background border border-border shadow-xl">
        <div className="bg-muted/40 px-6 py-5 border-b border-border/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-extrabold text-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Lên kế hoạch Môn học
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-xs sm:text-sm text-muted-foreground">
            Thêm môn học vào học kỳ dự kiến để tính toán và dự phóng GPA.
          </DialogDescription>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Học kỳ dự kiến</Label>
            <Select 
              value={`${year}|${term}`} 
              onValueChange={(val) => {
                const [y, t] = val.split('|');
                setYear(y);
                setTerm(t);
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl shadow-2xs font-medium text-xs">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {semesterOptions.map(opt => (
                  <SelectItem key={`${opt.year}|${opt.term}`} value={`${opt.year}|${opt.term}`} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Môn học</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal text-left h-auto min-h-9 py-2 rounded-xl shadow-2xs text-xs"
                >
                  {selectedSubject ? (
                    <span className="truncate font-semibold text-foreground">{selectedSubject.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Tìm kiếm theo tên hoặc mã môn...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[340px] sm:w-[420px] p-0 shadow-lg rounded-xl" align="start">
                <Command 
                  filter={(value, search) => {
                    if (removeAccents(value).includes(removeAccents(search))) return 1;
                    return 0;
                  }}
                >
                  <CommandInput placeholder="Gõ tên hoặc mã môn học..." className="h-10 text-xs" />
                  <CommandList className="max-h-60">
                    <CommandEmpty className="py-5 text-center text-xs text-muted-foreground">Không tìm thấy môn học.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((sub) => (
                        <CommandItem
                          key={sub.code}
                          value={`${sub.code} ${sub.name}`}
                          onSelect={() => {
                            setSelectedSubject(sub);
                            setComboOpen(false);
                          }}
                          className="py-2 px-3 cursor-pointer text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2.5 h-3.5 w-3.5 text-primary",
                              selectedSubject?.code === sub.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground text-xs">{sub.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.2 rounded w-fit">{sub.code} • {sub.credits} tín chỉ</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedSubject && (
            <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">Điểm thi dự kiến</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={exam} 
                  onChange={e => setExam(e.target.value)}
                  placeholder="VD: 8.5"
                  className="font-mono font-bold text-xs h-9 rounded-lg shadow-2xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground">Hoặc Tổng kết dự kiến</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={course} 
                  onChange={e => setCourse(e.target.value)}
                  placeholder="VD: 8.0"
                  className="font-mono font-bold text-xs h-9 rounded-lg shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/40 px-5 sm:px-6 py-3.5 border-t border-border/80 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-8 rounded-xl font-medium">Hủy</Button>
          <Button disabled={!selectedSubject || !year || !term} onClick={handleSave} size="sm" className="font-bold text-xs h-8.5 rounded-xl px-4 shadow-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm vào kế hoạch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}