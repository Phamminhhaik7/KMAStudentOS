import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { extractCurlCredentials } from '@/lib/utils';
import { Settings, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CookieDialog({ 
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
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please paste something.");
      return;
    }

    if (trimmed.startsWith('curl')) {
      const creds = extractCurlCredentials(trimmed);
      if (creds) {
        onSave(creds.cookie, creds.ua);
        setInput('');
        onOpenChange(false);
      } else {
        setError("Could not extract Cookie and User-Agent from the cURL command.");
      }
    } else {
      // Assume they just pasted the cookie string
      if (trimmed.includes('=')) {
        onSave(trimmed, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36");
        setInput('');
        onOpenChange(false);
      } else {
        setError("Invalid cookie format.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Sync Portal Data
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground/80">
            Paste your portal session cookie or a full <code className="bg-muted px-1 py-0.5 rounded text-primary">cURL</code> command from your browser's network tab to sync live grades.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea 
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            placeholder="curl 'https://.../api' -H 'Cookie: ASP.NET_SessionId=...'"
            className="font-mono text-xs h-32 resize-none"
          />
          {error && (
            <div className="text-destructive text-sm mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mb-4 text-sm border">
          <div className="flex items-start justify-between mb-2">
            <span className="font-semibold text-foreground/90">Current Status</span>
            {hasCookie ? (
              <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border", 
                isLive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {isLive ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {isLive ? "Connected to Portal" : "Cookie Expired"}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full border bg-muted">
                Offline Mode (Sample Data)
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Your cookie stays strictly in your browser's <code className="bg-muted/80 px-1 py-0.5 rounded">localStorage</code> and is only sent directly to the ACTVN portal via the API proxy.
          </p>
        </div>

        <DialogFooter className="flex flex-row sm:justify-between items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/5"
            disabled={!hasCookie}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">Save & Sync</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}