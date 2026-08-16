import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogIn, LogOut, KeyRound, Cookie, Loader2, AlertCircle, CheckCircle2, ShieldCheck, School } from 'lucide-react';
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
  onSaveCookie,
  onLogout,
}: QldtLoginDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'credentials' | 'cookie'>('credentials');
  
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
  const [rawCookie, setRawCookie] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        title: 'Đăng nhập QLĐT thành công',
        description: 'Đã tải dữ liệu thời khóa biểu thực tế từ hệ thống.',
      });
      setPassword('');
      onOpenChange(false);
    } else {
      setErrorMessage(result.error || 'Đăng nhập thất bại.');
    }
  };

  const handleCookieSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCookie.trim()) {
      setErrorMessage('Vui lòng dán chuỗi cookie ASP.NET.');
      return;
    }

    onSaveCookie(rawCookie.trim());
    toast({
      title: 'Đã lưu Cookie QLĐT',
      description: 'Đang tải lại thời khóa biểu theo cookie đã cung cấp.',
    });
    setRawCookie('');
    onOpenChange(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    toast({
      title: 'Đã đăng xuất QLĐT',
      description: 'Chuyển về chế độ hiển thị thời khóa biểu mẫu.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Cổng Đào Tạo QLĐT ACTVN</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                qldt.actvn.edu.vn • Đồng bộ thời khóa biểu sinh viên
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {hasCookie && isLive && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Đã kết nối trực tuyến
                </p>
                <p className="text-xs font-mono text-emerald-700/80 dark:text-emerald-400">
                  {studentInfo || 'Sinh viên ACTVN'}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Đăng xuất
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setErrorMessage(null); }} className="w-full mt-1">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="credentials" className="text-xs gap-1.5 font-medium">
              <KeyRound className="w-3.5 h-3.5" />
              Tài khoản QLĐT
            </TabsTrigger>
            <TabsTrigger value="cookie" className="text-xs gap-1.5 font-medium">
              <Cookie className="w-3.5 h-3.5" />
              Dán Cookie
            </TabsTrigger>
          </TabsList>

          {errorMessage && (
            <Alert variant="destructive" className="my-3 py-2 text-xs">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="credentials" className="space-y-4 pt-2">
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="qldt-username" className="text-xs font-semibold">
                  Mã sinh viên (Tài khoản)
                </Label>
                <Input
                  id="qldt-username"
                  placeholder="Ví dụ: CT100127"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="font-mono text-sm"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qldt-password" className="text-xs font-semibold">
                  Mật khẩu QLĐT
                </Label>
                <Input
                  id="qldt-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-muted/40 rounded-lg text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Thông tin đăng nhập được gửi trực tiếp tới máy chủ QLĐT ACTVN để lấy phiên làm việc, không lưu trữ mật khẩu trên hệ thống.
                </span>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-semibold gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang kết nối QLĐT...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Đăng nhập & Tải lịch học
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="cookie" className="space-y-4 pt-2">
            <form onSubmit={handleCookieSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="qldt-cookie" className="text-xs font-semibold">
                  Chuỗi Cookie (ASP.NET_SessionId & SignIn)
                </Label>
                <textarea
                  id="qldt-cookie"
                  rows={4}
                  placeholder="ASP.NET_SessionId=...; SignIn=..."
                  value={rawCookie}
                  onChange={(e) => setRawCookie(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-input bg-background font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lấy từ tab Network (F12) trên trình duyệt sau khi đăng nhập vào qldt.actvn.edu.vn.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="w-full font-semibold gap-2">
                  <Cookie className="w-4 h-4" />
                  Lưu Cookie & Đồng bộ
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
