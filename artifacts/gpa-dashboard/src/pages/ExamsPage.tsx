import { useState, useMemo } from 'react';
import { useExams, ExamItem } from '@/hooks/use-exams';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ExamsPage() {
  const { toast } = useToast();
  const { exams, addExam, deleteExam } = useExams();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [examSubject, setExamSubject] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examRoom, setExamRoom] = useState('');
  const [examStudentNo, setExamStudentNo] = useState('');
  const [examType, setExamType] = useState<'Cuối kỳ' | 'Giữa kỳ' | 'Thi lại'>('Cuối kỳ');
  const [examNotes, setExamNotes] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Sorted exams
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate));
  }, [exams]);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubject.trim() || !examDate) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên môn thi và ngày thi.',
      });
      return;
    }

    addExam({
      subjectName: examSubject.trim(),
      courseCode: examCode.trim() || 'KMA',
      examDate: examDate,
      examTime: examTime.trim() || '09:00 - 10:30',
      room: examRoom.trim() || '402-TA1',
      studentNo: examStudentNo.trim() || undefined,
      examType: examType,
      notes: examNotes.trim() || undefined,
    });

    toast({
      title: 'Đã thêm lịch thi thành công! 📝',
      description: `${examSubject} (${examDate})`,
    });

    setExamSubject('');
    setExamCode('');
    setExamDate('');
    setExamTime('');
    setExamRoom('');
    setExamStudentNo('');
    setExamNotes('');
    setCreateDialogOpen(false);
  };

  const getDaysDiff = (examDateStr: string) => {
    const diff = new Date(examDateStr).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand" />
            Lịch Thi & Phòng Thi
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Theo dõi thời gian thi, phòng thi, số báo danh và đếm ngược ngày thi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 h-8.5 shadow-xs font-bold text-xs rounded-xl px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm lịch thi
          </Button>
        </div>
      </div>

      {/* Exam Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedExams.map((exam) => {
          const daysLeft = getDaysDiff(exam.examDate);
          const isPast = daysLeft < 0;
          const isToday = daysLeft === 0;

          return (
            <Card
              key={exam.id}
              className={`border-border bg-card rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isPast ? 'opacity-50' : ''
              }`}
            >
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <Badge className="bg-primary text-primary-foreground font-black text-xs px-2.5 py-0.5 shadow-2xs">
                    🏢 {exam.room}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`font-mono text-xs font-extrabold px-2 py-0.5 ${
                      isToday
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : daysLeft > 0 && daysLeft <= 3
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPast ? 'Đã thi xong' : isToday ? '🔥 HÔM NAY THI' : `Còn ${daysLeft} ngày`}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground leading-snug">
                    {exam.subjectName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 font-mono text-xs text-muted-foreground">
                    <span>{exam.courseCode}</span>
                    <span>•</span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                      {exam.examType}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand" />
                      Ngày thi:
                    </span>
                    <span className="font-bold text-foreground font-mono">{exam.examDate}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      Giờ thi:
                    </span>
                    <span className="font-bold text-foreground font-mono">{exam.examTime}</span>
                  </div>

                  {exam.studentNo && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        Số báo danh:
                      </span>
                      <span className="font-extrabold text-brand font-mono">{exam.studentNo}</span>
                    </div>
                  )}
                </div>

                {exam.notes && (
                  <p className="text-[11px] bg-muted/40 p-2 rounded-xl text-muted-foreground italic border border-border/40">
                    {exam.notes}
                  </p>
                )}

                <div className="pt-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExam(exam.id)}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Xóa lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedExams.length === 0 && (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-border p-6 shadow-xs">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2.5" />
          <h3 className="font-bold text-base text-foreground">Chưa có lịch thi nào</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Thêm lịch thi các môn học để ứng dụng tự động đếm ngược ngày thi cho bạn.
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="mt-4 font-bold text-xs h-8.5 px-4 gap-1.5 shadow-xs bg-primary text-primary-foreground rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm lịch thi
          </Button>
        </div>
      )}

      {/* Create Exam Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-5 border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              Thêm lịch thi mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tên môn thi</Label>
              <Input
                placeholder="VD: Vật lý đại cương 2..."
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Mã môn học</Label>
                <Input
                  placeholder="VD: PHY102"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Hình thức thi</Label>
                <Select
                  value={examType}
                  onValueChange={(val: any) => setExamType(val)}
                >
                  <SelectTrigger className="text-xs h-9 rounded-lg">
                    <SelectValue placeholder="Loại thi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Cuối kỳ" className="text-xs font-bold">Cuối kỳ</SelectItem>
                    <SelectItem value="Giữa kỳ" className="text-xs font-bold">Giữa kỳ</SelectItem>
                    <SelectItem value="Thi lại" className="text-xs font-bold text-destructive">Thi lại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Ngày thi</Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Giờ thi</Label>
                <Input
                  placeholder="VD: 09:00 - 10:30"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Phòng thi</Label>
                <Input
                  placeholder="VD: 402-TA1"
                  value={examRoom}
                  onChange={(e) => setExamRoom(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Số báo danh (SBD)</Label>
                <Input
                  placeholder="VD: SBD 45"
                  value={examStudentNo}
                  onChange={(e) => setExamStudentNo(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Ghi chú (tùy chọn)</Label>
              <Input
                placeholder="VD: Mang theo máy tính, thi trắc nghiệm..."
                value={examNotes}
                onChange={(e) => setExamNotes(e.target.value)}
                className="text-xs h-9 rounded-lg"
              />
            </div>

            <Button type="submit" className="w-full font-bold text-xs h-9 rounded-xl shadow-xs mt-2 bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" />
              Lưu lịch thi
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExamsPage;
