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

  // Generate semester options based on existing + 2 future years
  const semesterOptions = useMemo(() => {
    const years = new Set(existingSemesters.map(s => s.year));
    let latestYearStart = 2023;
    
    if (years.size > 0) {
      const sorted = Array.from(years).sort();
      const latest = sorted[sorted.length - 1]; // e.g. "2023-2024"
      if (latest) {
        latestYearStart = parseInt(latest.split('-')[0], 10);
      }
    }

    const options: { year: string, term: string, label: string }[] = [];
    
    // Add existing ones uniquely
    const existing = new Set<string>();
    existingSemesters.forEach(s => {
      const key = `${s.year}|${s.term}`;
      if (!existing.has(key)) {
        existing.add(key);
        options.push({ year: s.year, term: s.term, label: `Học kỳ ${s.term} (${s.year})` });
      }
    });

    // Add some future ones
    for (let i = 0; i < 3; i++) {
      const yStr = `${latestYearStart + i}-${latestYearStart + i + 1}`;
      for (const t of ['1', '2', '3']) {
        const key = `${yStr}|${t}`;
        if (!existing.has(key)) {
          options.push({ year: yStr, term: t, label: `Học kỳ ${t} (${yStr}) - Planned` });
        }
      }
    }

    // Sort options chronologically
    return options.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      return a.term.localeCompare(b.term);
    });
  }, [existingSemesters]);

  // Set default semester on open
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <BookOpen className="w-5 h-5 text-primary" />
            Plan a Subject
          </DialogTitle>
          <DialogDescription>
            Add a subject from the curriculum to see how it affects your GPA.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label>Semester</Label>
            <Select 
              value={`${year}|${term}`} 
              onValueChange={(val) => {
                const [y, t] = val.split('|');
                setYear(y);
                setTerm(t);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
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

          <div className="grid gap-2">
            <Label>Subject</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedSubject ? selectedSubject.name : "Search subjects..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[430px] p-0" align="start">
                <Command 
                  filter={(value, search) => {
                    if (removeAccents(value).includes(removeAccents(search))) return 1;
                    return 0;
                  }}
                >
                  <CommandInput placeholder="Search by name or code..." />
                  <CommandList>
                    <CommandEmpty>No subject found in curriculum.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((sub) => (
                        <CommandItem
                          key={sub.code}
                          value={`${sub.code} ${sub.name}`}
                          onSelect={() => {
                            setSelectedSubject(sub);
                            setComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSubject?.code === sub.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{sub.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{sub.code} • {sub.credits} tín chỉ</span>
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
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Expected Exam Score</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={exam} 
                  onChange={e => setExam(e.target.value)}
                  placeholder="e.g. 8.5"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Or Final Course Score</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={course} 
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g. 8.0"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selectedSubject || !year || !term} onClick={handleSave}>
            <Plus className="w-4 h-4 mr-2" />
            Add to Planner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}