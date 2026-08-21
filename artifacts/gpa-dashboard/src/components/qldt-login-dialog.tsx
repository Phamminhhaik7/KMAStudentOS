import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, KeyRound, Loader2, AlertCircle, CheckCircle2, School } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QldtLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasCookie: boolean;
  isLive: boolean;
  studentInfo?: string;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSaveCookie: (cookie: string) => void;
  onLogout: () => void;
}

export function QldtLoginDialog({
  open,
  onOpenChange,
  hasCookie,
  isLive,
  studentInfo,
  onLogin,
  onLogout,
}: QldtLoginDialogProps) {
  const { toast } = useToast();
  
  const savedCreds = (() => {
    try {
      const raw = localStorage.getItem('actvn_qldt_credentials');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const [username, setUsername] = useState(savedCreds?.username || '');
  const [password, setPassword] = useState(savedCreds?.password || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      try {
        const raw = localStorage.getItem('actvn_qldt_credentials');
        if (raw) {
          const creds = JSON.parse(raw);
          if (creds.username) setUsername(creds.username);
          if (creds.password) setPassword(creds.password);
        }
      } catch {
        // ignore
      }
      setErrorMessage(null);
    }
  }, [open]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Mã sinh viên và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const result = await onLogin(username.trim(), password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Đăng nhập QLĐT thành công! 🎉',
        description: 'Đã tải thời khóa biểu và phòng học thực tế từ hệ thống.',
      });
      setPassword('');
      onOpenChange(false);
    } else {
      setErrorMessage(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.');
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    toast({
      title: 'Đã đăng xuất Cổng QLĐT',
      description: 'Chuyển về trạng thái chưa đăng nhập.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-6 border border-border shadow-xl bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-2xs shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Cổng Đào Tạo QLĐT ACTVN
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                qldt.actvn.edu.vn • Đăng nhập bằng tài khoản sinh viên QLĐT
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {hasCookie && isLive && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between my-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Đã kết nối trực tuyến QLĐT
                </p>
                <p className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400 font-semibold">
                  {studentInfo || 'Sinh viên ACTVN'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              className="text-xs h-7.5 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-lg font-bold cursor-pointer"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Đăng xuất
            </Button>
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="qldt-username" className="text-xs font-bold text-foreground">
              Mã sinh viên / Tài khoản QLĐT
            </Label>
            <Input
              id="qldt-username"
              type="text"
              placeholder="VD: AT180123"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrorMessage(null);
              }}
              required
              className="font-mono text-xs h-9 rounded-xl shadow-2xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qldt-password" className="text-xs font-bold text-foreground">
              Mật khẩu QLĐT
            </Label>
            <Input
              id="qldt-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              required
              className="text-xs h-9 rounded-xl shadow-2xs"
            />
            <p className="text-[10.5px] text-muted-foreground leading-tight">
              Tài khoản được mã hóa và lưu trữ an toàn trong LocalStorage của bạn.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold text-xs h-9 shadow-xs rounded-xl bg-primary text-primary-foreground cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang kết nối Cổng QLĐT...
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Đăng nhập & Tải Thời khóa biểu
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
