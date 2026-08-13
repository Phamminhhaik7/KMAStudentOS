import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { extractCurlCredentials } from '@/lib/utils';
import { LogOut, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExchangeMicrosoftCode } from '@workspace/api-client-react';

export function AuthDialog({ 
  open, 
  onOpenChange, 
  onSave,
  onClear,
  hasCookie,
  isLive
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (cookie: string, ua: string) => void;
  onClear: () => void;
  hasCookie: boolean;
  isLive: boolean;
}) {
  const [mode, setMode] = useState<'microsoft' | 'manual'>('microsoft');
  const [urlInput, setUrlInput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [error, setError] = useState('');
  
  const exchangeCode = useExchangeMicrosoftCode();

  const handleLoginClick = () => {
    window.open(
      'https://login.microsoftonline.com/0aa16d8a-a396-4e21-aa14-2a68a45786bc/oauth2/v2.0/authorize?response_type=code&client_id=fbad147e-ffd3-419f-989a-7aceae620f77&redirect_uri=https%3A%2F%2Fktdbcl.actvn.edu.vn%2Findex.php%2Faksociallogin_finishLogin%2Fmicrosoft.raw&scope=user.read&response_mode=fragment',
      '_blank'
    );
  };

  const handleMicrosoftSubmit = () => {
    setError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Vui lòng dán liên kết (URL) sau khi đăng nhập.");
      return;
    }
    
    exchangeCode.mutate({ data: { redirectUrl: trimmed } }, {
      onSuccess: (res) => {
        onSave(res.cookie, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36");
        setUrlInput('');
        onOpenChange(false);
      },
      onError: (err: any) => {
        setError(err?.error || "Không thể đồng bộ. Vui lòng kiểm tra lại liên kết hoặc thử lại.");
      }
    });
  };

  const handleManualSubmit = () => {
    setError('');
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setError("Vui lòng dán dữ liệu.");
      return;
    }

    if (trimmed.startsWith('curl')) {
      const creds = extractCurlCredentials(trimmed);
      if (creds) {
        onSave(creds.cookie, creds.ua);
        setManualInput('');
        onOpenChange(false);
      } else {
        setError("Không thể trích xuất Cookie và User-Agent từ lệnh cURL.");
      }
    } else {
      if (trimmed.includes('=')) {
        onSave(trimmed, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36");
        setManualInput('');
        onOpenChange(false);
      } else {
        setError("Định dạng cookie không hợp lệ.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        <div className="bg-muted/30 px-6 py-6 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Đồng bộ Cổng thông tin
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/70 text-sm leading-relaxed">
            Kết nối trực tiếp với cổng Khảo thí ACTVN để tự động tải điểm số mới nhất của bạn.
          </DialogDescription>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-muted/50 p-1 rounded-lg">
            <button 
              onClick={() => setMode('microsoft')}
              className={cn("flex-1 text-sm font-semibold py-2 rounded-md transition-colors", mode === 'microsoft' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Tài khoản Microsoft
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={cn("flex-1 text-sm font-semibold py-2 rounded-md transition-colors", mode === 'manual' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Nhập thủ công
            </button>
          </div>

          {mode === 'microsoft' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-medium mb-2">Đăng nhập bằng tài khoản nhà trường</p>
                    <Button onClick={handleLoginClick} className="w-full sm:w-auto bg-[#0078D4] hover:bg-[#006CBE] text-white shadow-sm border-transparent">
                      Đăng nhập với Microsoft
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 pt-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <div className="w-full">
                    <p className="text-sm font-medium mb-1">Sao chép liên kết cuối cùng</p>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      Sau khi đăng nhập, trình duyệt sẽ chuyển hướng (có thể báo lỗi). Hãy <strong>copy toàn bộ thanh địa chỉ URL</strong> và dán vào đây:
                    </p>
                    <Input 
                      value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); setError(''); }}
                      placeholder="https://ktdbcl.actvn.edu.vn/...&code=..."
                      className="font-mono text-xs mb-3 shadow-sm h-10"
                    />
                    <Button 
                      onClick={handleMicrosoftSubmit} 
                      disabled={!urlInput.trim() || exchangeCode.isPending} 
                      className="w-full shadow-sm"
                    >
                      {exchangeCode.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4 mr-2" />
                      )}
                      Đồng bộ dữ liệu
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dán <strong>Cookie</strong> hoặc lệnh <strong>cURL</strong> từ Network Tab của trình duyệt để tiếp tục phiên đăng nhập hiện tại.
              </p>
              <Textarea 
                value={manualInput}
                onChange={(e) => { setManualInput(e.target.value); setError(''); }}
                placeholder="curl 'https://.../api' -H 'Cookie: ASP.NET_SessionId=...'"
                className="font-mono text-xs h-32 resize-none shadow-sm"
              />
              <Button onClick={handleManualSubmit} className="w-full shadow-sm">
                Lưu & Đồng bộ
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 text-sm mt-4 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-muted/30 px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Trạng thái:</span>
            {hasCookie ? (
              <span className={cn("flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full border text-xs shadow-sm", 
                isLive ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              )}>
                {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isLive ? "Đã kết nối" : "Hết hạn"}
              </span>
            ) : (
              <span className="text-muted-foreground font-semibold px-2.5 py-1 rounded-full border bg-muted/50 text-xs shadow-sm">
                Ngoại tuyến (Dữ liệu mẫu)
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            {hasCookie && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  onClear();
                  onOpenChange(false);
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="shadow-sm">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}