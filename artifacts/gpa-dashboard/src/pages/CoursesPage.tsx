import { useState, useMemo } from 'react';
import { useGpaData } from '@/hooks/use-gpa-data';
import { useTimetable } from '@/hooks/use-timetable';
import { Grade } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Search,
  Calculator,
  User,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
  Award,
} from 'lucide-react';

export function CoursesPage() {
  const { grades, gpaScale } = useGpaData();
  const { timetable } = useTimetable();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<Grade | null>(null);

  // Grade Calculator state
  const [customTarget, setCustomTarget] = useState<number>(8.5); // Default A

  // Extract unique semesters
  const semestersList = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => {
      if (g.year && g.term) set.add(`${g.year}|${g.term}`);
    });
    return Array.from(set).sort().reverse();
  }, [grades]);

  // Filtered courses
  const filteredGrades = useMemo(() => {
    return grades.filter((g) => {
      const matchSearch =
        !searchQuery.trim() ||
        g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSemester =
        selectedSemester === 'all' || `${g.year}|${g.term}` === selectedSemester;

      return matchSearch && matchSemester;
    });
  }, [grades, searchQuery, selectedSemester]);

  // Grade calculation for selected course (NO AI, Math only)
  const calcResults = useMemo(() => {
    if (!selectedCourseDetail) return null;

    const dqtVal = parseFloat(selectedCourseDetail.dqt);
    const hasDqt = !isNaN(dqtVal) && dqtVal > 0;

    const targets = [
      { label: 'Điểm B (7.0 - Khá)', score: 7.0 },
      { label: 'Điểm B+ (8.0 - Giỏi)', score: 8.0 },
      { label: 'Điểm A (8.5 - Xuất sắc)', score: 8.5 },
      { label: 'Điểm A+ (9.0 - Tối đa)', score: 9.0 },
    ];

    if (!hasDqt) {
      return {
        hasDqt: false,
        dqt: 0,
        targets: [],
      };
    }

    const calculatedTargets = targets.map((t) => {
      // Công thức KMA: Tổng kết = ĐQT * 0.3 + Thi * 0.7
      // => Thi = (Mục tiêu - ĐQT * 0.3) / 0.7
      const neededExam = (t.score - dqtVal * 0.3) / 0.7;
      return {
        ...t,
        neededExam: Math.max(0, parseFloat(neededExam.toFixed(2))),
        isPossible: neededExam <= 10.0,
      };
    });

    // Custom target
    const customNeededExam = (customTarget - dqtVal * 0.3) / 0.7;

    return {
      hasDqt: true,
      dqt: dqtVal,
      targets: calculatedTargets,
      customNeeded: Math.max(0, parseFloat(customNeededExam.toFixed(2))),
      customPossible: customNeededExam <= 10.0,
    };
  }, [selectedCourseDetail, customTarget]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand" />
            Quản lý Môn học
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Danh sách tất cả các học phần trong chương trình đào tạo và chi tiết điểm số
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground font-black text-xs px-3 py-1 rounded-xl">
            {filteredGrades.length} môn học
          </Badge>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên môn hoặc mã học phần..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl border-border bg-muted/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 px-3 text-xs font-bold rounded-xl border border-border bg-card text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="all">Tất cả các học kỳ</option>
            {semestersList.map((sem) => {
              const [y, t] = sem.split('|');
              return (
                <option key={sem} value={sem}>
                  Học kỳ {t} ({y})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Course Cards Grid */}
      {filteredGrades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredGrades.map((grade) => {
            const isCompleted = grade.course && grade.course !== '-';
            return (
              <Card
                key={grade.stt}
                onClick={() => setSelectedCourseDetail(grade)}
                className="border-border bg-card rounded-2xl shadow-xs hover:shadow-md hover:border-brand/40 active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between"
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                      {grade.code}
                    </span>
                    <Badge
                      className={`text-[10.5px] font-black font-mono px-2 py-0.5 ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {grade.letter || 'Đang học'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground leading-snug line-clamp-2">
                      {grade.subject}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground mt-1">
                      Kỳ {grade.term} • Năm học {grade.year}
                    </p>
                  </div>

                  {/* Component Scores Snippet */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/60 text-center font-mono text-xs">
                    <div className="bg-muted/40 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold">TC</p>
                      <p className="font-bold text-foreground mt-0.5">{grade.credits}</p>
                    </div>
                    <div className="bg-muted/40 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold">ĐQT</p>
                      <p className="font-bold text-foreground mt-0.5">{grade.dqt || '-'}</p>
                    </div>
                    <div className="bg-muted/40 p-1.5 rounded-lg">
                      <p className="text-[9px] text-muted-foreground font-bold">Thi</p>
                      <p className="font-bold text-foreground mt-0.5">{grade.exam || '-'}</p>
                    </div>
                    <div className="bg-primary/5 p-1.5 rounded-lg border border-primary/10">
                      <p className="text-[9px] text-primary font-bold">Tổng</p>
                      <p className="font-black text-primary mt-0.5">{grade.course || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border p-6 shadow-xs">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2.5" />
          <h3 className="font-bold text-base text-foreground">Không tìm thấy môn học</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Thử tìm kiếm với từ khóa khác hoặc chuyển sang học kỳ khác.
          </p>
        </div>
      )}

      {/* Course Detail Modal + Grade Calculator */}
      <Dialog
        open={!!selectedCourseDetail}
        onOpenChange={(open) => !open && setSelectedCourseDetail(null)}
      >
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-border shadow-xl bg-card">
          {selectedCourseDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {selectedCourseDetail.code}
                  </Badge>
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    {selectedCourseDetail.credits} Tín chỉ
                  </Badge>
                  {selectedCourseDetail.letter && (
                    <Badge variant="secondary" className="font-mono font-bold text-xs">
                      Điểm chữ: {selectedCourseDetail.letter}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg font-extrabold leading-snug">
                  {selectedCourseDetail.subject}
                </DialogTitle>
                <DialogDescription className="font-mono text-xs text-muted-foreground">
                  Học kỳ {selectedCourseDetail.term} • Năm học {selectedCourseDetail.year}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Score Summary Box */}
                <div className="grid grid-cols-5 gap-2 bg-muted/40 p-3.5 rounded-xl border border-border/80 text-center font-mono">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">TP1 (10%)</p>
                    <p className="font-bold text-sm text-foreground mt-1">{selectedCourseDetail.tp1 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">TP2 (10%)</p>
                    <p className="font-bold text-sm text-foreground mt-1">{selectedCourseDetail.tp2 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">ĐQT (30%)</p>
                    <p className="font-bold text-sm text-foreground mt-1">{selectedCourseDetail.dqt || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold">Điểm thi (70%)</p>
                    <p className="font-bold text-sm text-foreground mt-1">{selectedCourseDetail.exam || '-'}</p>
                  </div>
                  <div className="bg-primary text-primary-foreground rounded-lg p-1">
                    <p className="text-[10px] opacity-80 font-bold">Tổng kết</p>
                    <p className="font-black text-sm mt-1">{selectedCourseDetail.course || '-'}</p>
                  </div>
                </div>

                {/* 🧮 Grade Calculator Section (Math-based, NO AI) */}
                <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-brand" />
                    <h4 className="font-extrabold text-xs text-foreground">
                      Công cụ Tính điểm thi cần đạt (Grade Calculator)
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Công thức KMA: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">Tổng kết = (ĐQT × 0.3) + (Điểm thi × 0.7)</code>
                  </p>

                  {calcResults?.hasDqt ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        {calcResults.targets.map((t, i) => (
                          <div key={i} className="p-2.5 bg-muted/40 rounded-xl border border-border/80">
                            <p className="text-[10px] font-bold text-muted-foreground truncate">{t.label}</p>
                            <p className={`font-mono text-base font-black mt-1 ${t.isPossible ? 'text-brand' : 'text-destructive'}`}>
                              {t.isPossible ? `${t.neededExam}` : 'Không đủ'}
                            </p>
                            <span className="text-[9px] text-muted-foreground">điểm thi cuối kỳ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/20 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                      <AlertCircle className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                      <span>Chưa có Điểm quá trình (ĐQT) để tính toán điểm thi cần đạt.</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CoursesPage;
