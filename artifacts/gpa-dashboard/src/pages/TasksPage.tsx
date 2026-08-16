import { useState, useMemo } from 'react';
import { useTasks, Task } from '@/hooks/use-tasks';
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
  CheckSquare,
  Plus,
  Trash2,
  Clock,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TasksPage() {
  const { toast } = useToast();
  const { tasks, addTask, updateTask, deleteTask, toggleTaskStatus } = useTasks();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNotes, setNewNotes] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.courseName && t.courseName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchSearch && matchPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const todoTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'todo'), [filteredTasks]);
  const doingTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'doing'), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter((t) => t.status === 'done'), [filteredTasks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      toast({
        variant: 'destructive',
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập tên công việc và ngày hết hạn.',
      });
      return;
    }

    addTask({
      title: newTitle.trim(),
      courseName: newCourse.trim() || undefined,
      dueDate: newDueDate,
      priority: newPriority,
      status: 'todo',
      notes: newNotes.trim() || undefined,
    });

    toast({
      title: 'Đã tạo công việc mới! ✅',
      description: newTitle,
    });

    setNewTitle('');
    setNewCourse('');
    setNewDueDate('');
    setNewNotes('');
    setCreateDialogOpen(false);
  };

  const renderTaskCard = (task: Task) => {
    const isDone = task.status === 'done';
    return (
      <Card
        key={task.id}
        className={`border-border bg-card rounded-2xl shadow-2xs hover:shadow-xs transition-all ${
          isDone ? 'opacity-60 bg-muted/20' : ''
        }`}
      >
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleTaskStatus(task.id)}
                className="mt-0.5 rounded cursor-pointer accent-brand"
              />
              <p className={`text-xs font-bold text-foreground leading-snug break-words ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTask(task.id)}
              className="h-6 w-6 text-muted-foreground/40 hover:text-destructive shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          {task.courseName && (
            <Badge variant="outline" className="text-[10px] font-mono font-bold">
              {task.courseName}
            </Badge>
          )}

          {task.notes && (
            <p className="text-[11px] text-muted-foreground line-clamp-2">
              {task.notes}
            </p>
          )}

          <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-1.5 border-t border-border/50 font-medium">
            <span className="font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {task.dueDate}
            </span>

            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 font-bold ${
                  task.priority === 'high'
                    ? 'text-destructive border-destructive/30 bg-destructive/5'
                    : task.priority === 'medium'
                    ? 'text-warning border-warning/30 bg-warning/5'
                    : 'text-muted-foreground'
                }`}
              >
                {task.priority === 'high' ? 'Gấp' : task.priority === 'medium' ? 'Vừa' : 'Thường'}
              </Badge>

              {/* Status Switcher */}
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                className="text-[10px] font-bold bg-muted/60 text-foreground rounded px-1 py-0.5 border-none cursor-pointer"
              >
                <option value="todo">Cần làm</option>
                <option value="doing">Đang làm</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-brand" />
            Công việc & Deadline
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Quản lý bài tập lớn, deadline học phần và các công việc tự học
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 h-8.5 shadow-xs font-bold text-xs rounded-xl px-3.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Thêm công việc
          </Button>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Tìm theo tên bài tập hoặc môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl border-border bg-muted/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 px-3 text-xs font-bold rounded-xl border border-border bg-card text-foreground cursor-pointer"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="high">Ưu tiên Cao</option>
            <option value="medium">Ưu tiên Vừa</option>
            <option value="low">Ưu tiên Thấp</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-xl border border-border/70">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />
              Kanban
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 px-2.5 rounded-lg text-xs font-bold ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5 mr-1" />
              Danh sách
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or List */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: TODO */}
          <div className="space-y-3 bg-muted/20 p-3.5 rounded-2xl border border-border/80 min-h-[300px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                  Cần làm (TODO)
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                {todoTasks.length}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {todoTasks.map((t) => renderTaskCard(t))}
              {todoTasks.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Không có việc cần làm</p>
              )}
            </div>
          </div>

          {/* Column 2: DOING */}
          <div className="space-y-3 bg-muted/20 p-3.5 rounded-2xl border border-border/80 min-h-[300px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                  Đang làm (DOING)
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                {doingTasks.length}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {doingTasks.map((t) => renderTaskCard(t))}
              {doingTasks.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Không có việc đang làm</p>
              )}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="space-y-3 bg-muted/20 p-3.5 rounded-2xl border border-border/80 min-h-[300px]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-extrabold text-xs text-foreground uppercase tracking-wider">
                  Hoàn thành (DONE)
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono font-bold">
                {doneTasks.length}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {doneTasks.map((t) => renderTaskCard(t))}
              {doneTasks.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Chưa có việc hoàn thành</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => renderTaskCard(t))}
          {filteredTasks.length === 0 && (
            <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border p-6 shadow-xs">
              <CheckSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="font-bold text-sm text-foreground">Không có công việc nào phù hợp</p>
            </div>
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-5 border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" />
              Thêm công việc mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Tên công việc / Bài tập</Label>
              <Input
                placeholder="VD: Bài tập lớn Lập trình Web..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs h-9 rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Hạn chót (Deadline)</Label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="text-xs h-9 rounded-lg font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Mức ưu tiên</Label>
                <Select
                  value={newPriority}
                  onValueChange={(val: any) => setNewPriority(val)}
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
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                className="text-xs h-9 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Ghi chú thêm (tùy chọn)</Label>
              <Input
                placeholder="VD: Nhóm 4 người, nộp qua Google Classroom..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="text-xs h-9 rounded-lg"
              />
            </div>

            <Button type="submit" className="w-full font-bold text-xs h-9 rounded-xl shadow-xs mt-2 bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" />
              Tạo công việc
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TasksPage;
