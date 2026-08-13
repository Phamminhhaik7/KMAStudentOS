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
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        <div className="bg-muted/30 px-6 py-6 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Lên kế hoạch môn học
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/70">
            Thêm môn học từ chương trình đào tạo để xem ảnh hưởng tới GPA của bạn.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2.5">
            <Label className="font-semibold text-foreground/90">Học kỳ</Label>
            <Select 
              value={`${year}|${term}`} 
              onValueChange={(val) => {
                const [y, t] = val.split('|');
                setYear(y);
                setTerm(t);
              }}
            >
              <SelectTrigger className="w-full shadow-sm">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent>
                {semesterOptions.map(opt => (
                  <SelectItem key={`${opt.year}|${opt.term}`} value={`${opt.year}|${opt.term}`}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <Label className="font-semibold text-foreground/90">Môn học</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal text-left h-auto min-h-10 py-2 shadow-sm"
                >
                  {selectedSubject ? (
                    <span className="truncate">{selectedSubject.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Tìm kiếm môn học...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[430px] p-0 shadow-lg" align="start">
                <Command 
                  filter={(value, search) => {
                    if (removeAccents(value).includes(removeAccents(search))) return 1;
                    return 0;
                  }}
                >
                  <CommandInput placeholder="Tìm theo tên hoặc mã môn..." className="h-11" />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy môn học.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((sub) => (
                        <CommandItem
                          key={sub.code}
                          value={`${sub.code} ${sub.name}`}
                          onSelect={() => {
                            setSelectedSubject(sub);
                            setComboOpen(false);
                          }}
                          className="py-2.5 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 text-primary",
                              selectedSubject?.code === sub.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">{sub.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded w-fit border border-border/50">{sub.code} • {sub.credits} tín chỉ</span>
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
            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Điểm thi dự kiến</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={exam} 
                  onChange={e => setExam(e.target.value)}
                  placeholder="VD: 8.5"
                  className="font-mono font-medium shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">Hoặc Tổng kết dự kiến</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={course} 
                  onChange={e => setCourse(e.target.value)}
                  placeholder="VD: 8.0"
                  className="font-mono font-medium shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-muted/30 px-6 py-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-muted/50">Hủy</Button>
          <Button disabled={!selectedSubject || !year || !term} onClick={handleSave} className="min-w-[140px] shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Thêm vào kế hoạch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}