import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useExchangeMicrosoftCode } from '@workspace/api-client-react';

export function AuthDialog({
  open,
  onOpenChange,
  onSave,
  onClear,
  hasCookie,
  isLive,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cookie: string, ua: string) => void;
  onClear: () => void;
  hasCookie: boolean;
  isLive: boolean;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');

  const exchangeCode = useExchangeMicrosoftCode();

  const handleLoginClick = () => {
    window.open(
      'https://login.microsoftonline.com/0aa16d8a-a396-4e21-aa14-2a68a45786bc/oauth2/v2.0/authorize?response_type=code&client_id=fbad147e-ffd3-419f-989a-7aceae620f77&redirect_uri=https%3A%2F%2Fktdbcl.actvn.edu.vn%2Findex.php%2Faksociallogin_finishLogin%2Fmicrosoft.raw&scope=user.read&response_mode=fragment',
      '_blank',
    );
  };

  const handleMicrosoftSubmit = () => {
    setError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Vui lòng dán liên kết (URL) sau khi đăng nhập Microsoft.');
      return;
    }

    exchangeCode.mutate(
      { data: { redirectUrl: trimmed } },
      {
        onSuccess: (res) => {
          onSave(res.cookie, navigator.userAgent);
          setUrlInput('');
          setError('');
          onOpenChange(false);
        },
        onError: (err: any) => {
          setError(err?.error || 'Không thể đồng bộ. Vui lòng kiểm tra lại liên kết hoặc thử lại.');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-card border border-border shadow-xl">
        <div className="bg-muted/40 px-6 py-5 border-b border-border/80">
          <DialogTitle className="text-lg font-extrabold flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Đăng nhập Cổng Khảo Thí (Điểm số)
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-muted-foreground text-xs sm:text-sm leading-relaxed">
            ktdbcl.actvn.edu.vn • Đăng nhập bằng tài khoản sinh viên Microsoft (@actvn.edu.vn)
          </DialogDescription>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {hasCookie && isLive && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Đã kết nối trực tuyến Cổng Khảo thí
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClear}
                className="text-xs h-7.5 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-lg font-bold cursor-pointer"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Đăng xuất
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
              <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-foreground mb-2">
                  Đăng nhập tài khoản Microsoft trường cấp (@actvn.edu.vn)
                </p>
                <Button
                  type="button"
                  onClick={handleLoginClick}
                  size="sm"
                  className="bg-[#0078D4] hover:bg-[#006CBE] text-white font-bold text-xs h-8.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Đăng nhập Microsoft Online
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
              <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                2
              </div>
              <div className="w-full min-w-0">
                <p className="text-xs font-bold text-foreground mb-1">
                  Dán liên kết chuyển hướng
                </p>
                <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
                  Sau khi đăng nhập Microsoft xong, hãy <strong>sao chép toàn bộ thanh địa chỉ URL</strong> trên trình duyệt và dán vào đây:
                </p>
                <Input
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setError('');
                  }}
                  placeholder="https://ktdbcl.actvn.edu.vn/#code=..."
                  className="font-mono text-xs mb-2.5 shadow-2xs h-9 rounded-lg"
                />
                <Button
                  type="button"
                  onClick={handleMicrosoftSubmit}
                  disabled={!urlInput.trim() || exchangeCode.isPending}
                  size="sm"
                  className="w-full font-bold text-xs h-9 rounded-xl shadow-xs bg-primary text-primary-foreground cursor-pointer"
                >
                  {exchangeCode.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : null}
                  Xác nhận & Đồng bộ Bảng điểm
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}