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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-background border border-border shadow-xl">
        <div className="bg-muted/40 px-6 py-5 border-b border-border/80">
          <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2.5 text-foreground">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Đồng bộ Cổng Điểm Khảo Thí
          </DialogTitle>
          <DialogDescription className="pt-1.5 text-muted-foreground text-xs sm:text-sm leading-relaxed">
            ktdbcl.actvn.edu.vn • Kết nối cổng khảo thí để lấy bảng điểm chính thức của bạn.
          </DialogDescription>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex gap-1.5 mb-5 bg-muted/60 p-1 rounded-xl border border-border/70">
            <button 
              onClick={() => setMode('microsoft')}
              className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer", mode === 'microsoft' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Tài khoản Microsoft
            </button>
            <button 
              onClick={() => setMode('manual')}
              className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-all cursor-pointer", mode === 'manual' ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              Nhập Cookie thủ công
            </button>
          </div>

          {mode === 'microsoft' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">1</div>
                  <div>
                    <p className="text-xs font-bold text-foreground mb-2">Đăng nhập tài khoản trường (@actvn.edu.vn)</p>
                    <Button onClick={handleLoginClick} size="sm" className="w-full sm:w-auto bg-[#0078D4] hover:bg-[#006CBE] text-white font-bold text-xs h-8.5 rounded-xl shadow-xs">
                      Đăng nhập Microsoft Online
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">2</div>
                  <div className="w-full min-w-0">
                    <p className="text-xs font-bold text-foreground mb-1">Dán liên kết chuyển hướng</p>
                    <p className="text-[11px] text-muted-foreground mb-2.5 leading-relaxed">
                      Sau khi đăng nhập xong, hãy <strong>sao chép toàn bộ thanh địa chỉ URL</strong> trên trình duyệt và dán vào đây:
                    </p>
                    <Input 
                      value={urlInput}
                      onChange={(e) => { setUrlInput(e.target.value); setError(''); }}
                      placeholder="https://ktdbcl.actvn.edu.vn/...&code=..."
                      className="font-mono text-xs mb-2.5 shadow-2xs h-9 rounded-lg"
                    />
                    <Button 
                      onClick={handleMicrosoftSubmit} 
                      disabled={!urlInput.trim() || exchangeCode.isPending} 
                      size="sm"
                      className="w-full font-bold text-xs h-9 rounded-xl shadow-xs"
                    >
                      {exchangeCode.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4 mr-1.5" />
                      )}
                      Đồng bộ Bảng Điểm
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dán chuỗi <strong>Cookie</strong> hoặc lệnh <strong>cURL</strong> từ DevTools (F12) để tiếp tục phiên làm việc:
              </p>
              <Textarea 
                value={manualInput}
                onChange={(e) => { setManualInput(e.target.value); setError(''); }}
                placeholder="curl 'https://ktdbcl.actvn.edu.vn/...' -H 'Cookie: ...'"
                className="font-mono text-xs h-28 resize-none shadow-2xs rounded-xl"
              />
              <Button onClick={handleManualSubmit} size="sm" className="w-full font-bold text-xs h-9 rounded-xl shadow-xs">
                Lưu Cookie & Tải Điểm
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 text-xs mt-3 p-3 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-muted/40 px-6 py-3.5 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Trạng thái:</span>
            {hasCookie ? (
              <span className={cn("flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full border text-[11px]", 
                isLive ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20"
              )}>
                {isLive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {isLive ? "Đã kết nối" : "Hết hạn"}
              </span>
            ) : (
              <span className="text-muted-foreground font-bold px-2.5 py-0.5 rounded-full border bg-muted/60 text-[11px]">
                Chưa đăng nhập
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
                className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Đăng xuất
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-8 rounded-xl font-bold">
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}