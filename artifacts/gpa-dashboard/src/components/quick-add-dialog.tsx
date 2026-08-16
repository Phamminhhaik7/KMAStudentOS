import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, BookOpen, Calendar, GraduationCap, Plus } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { useExams } from '@/hooks/use-exams';
import { useToast } from '@/hooks/use-toast';

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAddSubject?: () => void;
}

export function QuickAddDialog({ open, onOpenChange, onOpenAddSubject }: QuickAddDialogProps) {
  const { toast } = useToast();
  const { addTask } = useTasks();
  const { addExam } = useExams();

  const [activeTab, setActiveTab] = useState<'task' | 'exam' | 'course'>('task');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourse, setTaskCourse] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Exam form state
  const [examSubject, setExamSubject] = useState('');
  const [examCode, setExamCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [examRoom, setExamRoom] = useState('');
  const [examType, setExamType] = useState<'Giữa kỳ' | 'Cuối kỳ'>('Cuối kỳ');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên công việc và hạn nộp.',
      });
      return;
    }

    addTask({
      title: taskTitle.trim(),
      courseName: taskCourse.trim() || undefined,
      dueDate: taskDueDate,
      priority: taskPriority,
      status: 'todo',
    });

    toast({
      title: 'Đã thêm công việc thành công! ✅',
      description: taskTitle,
    });

    setTaskTitle('');
    setTaskCourse('');
    setTaskDueDate('');
    onOpenChange(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubject.trim() || !examDate) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập môn thi và ngày thi.',
      });
      return;
    }

    addExam({
      subjectName: examSubject.trim(),
      courseCode: examCode.trim() || 'KMA',
      examDate: examDate,
      examTime: examTime.trim() || '09:00',
      room: examRoom.trim() || 'TA1',
      examType: examType,
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl p-5 border border-border shadow-xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
            <Plus className="w-5 h-5 text-brand" />
            Thêm Nhanh (Quick Add)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tạo nhanh bài tập, lịch thi hoặc môn học dự kiến
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full bg-muted/70 p-1 rounded-xl">
            <TabsTrigger value="task" className="text-xs font-bold gap-1.5 rounded-lg">
              <CheckSquare className="w-3.5 h-3.5" />
              Công việc
            </TabsTrigger>
            <TabsTrigger value="exam" className="text-xs font-bold gap-1.5 rounded-lg">
              <Calendar className="w-3.5 h-3.5" />
              Lịch thi
            </TabsTrigger>
            <TabsTrigger
              value="course"
              onClick={() => {
                onOpenChange(false);
                if (onOpenAddSubject) onOpenAddSubject();
              }}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Môn học
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: TASK FORM */}
          <TabsContent value="task" className="pt-3">
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Tên công việc / Bài tập</Label>
                <Input
                  placeholder="VD: Bài tập lớn Lập trình Web..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-xs h-9 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Hạn chót (Deadline)</Label>
                  <Input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="text-xs h-9 rounded-lg font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Độ ưu tiên</Label>
                  <Select
                    value={taskPriority}
                    onValueChange={(val: any) => setTaskPriority(val)}
                  >
                    <SelectTrigger className="text-xs h-9 rounded-lg">
                      <SelectValue placeholder="Ưu tiên" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="high" className="text-xs text-destructive font-bold">Cao (High)</SelectItem>
                      <SelectItem value="medium" className="text-xs text-warning font-bold">Vừa (Medium)</SelectItem>
                      <SelectItem value="low" className="text-xs text-muted-foreground font-bold">Thấp (Low)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Môn học liên quan (tùy chọn)</Label>
                <Input
                  placeholder="VD: Xác suất thống kê..."
                  value={taskCourse}
                  onChange={(e) => setTaskCourse(e.target.value)}
                  className="text-xs h-9 rounded-lg"
                />
              </div>

              <Button type="submit" className="w-full font-bold text-xs h-9 rounded-xl shadow-xs mt-2 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo công việc
              </Button>
            </form>
          </TabsContent>

          {/* TAB 2: EXAM FORM */}
          <TabsContent value="exam" className="pt-3">
            <form onSubmit={handleCreateExam} className="space-y-3.5">
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
                    placeholder="09:00 - 10:30"
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
                  <Label className="text-xs font-bold text-foreground">Hình thức thi</Label>
                  <Select
                    value={examType}
                    onValueChange={(val: any) => setExamType(val)}
                  >
                    <SelectTrigger className="text-xs h-9 rounded-lg">
                      <SelectValue placeholder="Loại" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Cuối kỳ" className="text-xs font-bold">Cuối kỳ</SelectItem>
                      <SelectItem value="Giữa kỳ" className="text-xs font-bold">Giữa kỳ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full font-bold text-xs h-9 rounded-xl shadow-xs mt-2 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" />
                Lưu lịch thi
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
