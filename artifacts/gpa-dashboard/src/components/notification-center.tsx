import { Bell, Check, Trash2, Clock, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, NotificationItem } from '@/hooks/use-notifications';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } =
    useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          title="Thông báo"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] sm:w-[380px] p-0 rounded-2xl border border-border shadow-xl overflow-hidden bg-card"
      >
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-foreground">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge className="bg-brand text-brand-foreground font-black text-[10px] px-1.5 py-0 rounded-full">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-[11px] h-7 px-2 text-muted-foreground hover:text-foreground font-bold"
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/40 ${
                  !n.isRead ? 'bg-accent/30' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                  {n.type === 'class' && <Clock className="w-4 h-4 text-brand" />}
                  {n.type === 'deadline' && <AlertCircle className="w-4 h-4 text-warning" />}
                  {n.type === 'grade' && <BookOpen className="w-4 h-4 text-success" />}
                  {n.type === 'system' && <Sparkles className="w-4 h-4 text-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-foreground font-black' : 'text-foreground/90'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {n.message}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(n.id);
                  }}
                  className="h-6 w-6 text-muted-foreground/40 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs">
              <p className="font-semibold">Không có thông báo mới</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
