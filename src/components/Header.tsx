import { useState } from 'react';
import { TrendingUp, Sparkles, Info, KeyRound, ShieldCheck } from 'lucide-react';
import { MarketSettings } from '@/types/indicators';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { COINS, EXCHANGES, TIMEFRAMES } from '@/types/indicators';
import { Slider } from './ui/slider';

interface HeaderProps {
  settings: MarketSettings;
  onSettingsChange: (settings: MarketSettings) => void;
  apiKey: string | null;
  onApiKeyChange: (key: string) => void;
}

const Header = ({ settings, onSettingsChange, apiKey, onApiKeyChange }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftKey, setDraftKey] = useState(apiKey || '');
  const [candleDisplay, setCandleDisplay] = useState(settings.candleLimit);

  const handleSave = () => {
    if (!draftKey.trim()) return;
    onApiKeyChange(draftKey.trim());
    setIsOpen(false);
  };

  const maskedKey = apiKey ? `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}` : 'Not set';
  const hasKey = Boolean(apiKey);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-primary/10 via-background to-secondary/40 border-b border-border/50 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse-glow" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-foreground">Indicator Playground</h1>
                <span className="text-[11px] px-2 py-1 rounded-full bg-secondary/80 text-muted-foreground border border-border/60">
                  No login needed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Learn, explore, understand</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-start md:justify-end">
            <span className={`text-[11px] px-2 py-1 rounded-full border flex items-center gap-1 ${hasKey ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' : 'bg-destructive/10 border-destructive/40 text-destructive'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {hasKey ? `Key: ${maskedKey}` : 'API key missing'}
            </span>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  {apiKey ? 'Update API Key' : 'Set API Key'}
                </Button>
              </DialogTrigger>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-secondary/70 transition-colors" aria-label="How to get API key">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="center" sideOffset={8} className="max-w-xs text-xs z-50">
                  Create a wallet at AgnicPay.xyz, generate an API key, then paste it here to fetch live candles.
                </TooltipContent>
              </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="api-key">Your provider API key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter API key"
                    value={draftKey}
                    onChange={(e) => setDraftKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Stored locally in your browser. Required to fetch market data.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setIsOpen(false)} size="sm">Cancel</Button>
                  <Button onClick={handleSave} size="sm">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30">Control center</span>
              </div>
              <div className="flex items-center gap-2 min-w-[90px]">
                <Label className="text-[11px] text-muted-foreground">Coin</Label>
                <Select value={settings.coin} onValueChange={(value) => onSettingsChange({ ...settings, coin: value })}>
                  <SelectTrigger className="h-8 w-[90px] bg-secondary/60 border-primary/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COINS.map((coin) => (
                      <SelectItem key={coin} value={coin}>{coin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 min-w-[110px]">
                <Label className="text-[11px] text-muted-foreground">Exchange</Label>
                <Select value={settings.exchange} onValueChange={(value) => onSettingsChange({ ...settings, exchange: value })}>
                  <SelectTrigger className="h-8 w-[110px] bg-secondary/60 border-primary/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCHANGES.map((ex) => (
                      <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 min-w-[100px]">
                <Label className="text-[11px] text-muted-foreground">Timeframe</Label>
                <Select value={settings.timeframe} onValueChange={(value) => onSettingsChange({ ...settings, timeframe: value })}>
                  <SelectTrigger className="h-8 w-[90px] bg-secondary/60 border-primary/30 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="flex flex-col">
                  <Label className="text-[11px] text-muted-foreground">Candles</Label>
                  <span className="text-xs text-primary font-semibold">{candleDisplay}</span>
                </div>
                <Slider
                  value={[candleDisplay]}
                  onValueChange={([val]) => setCandleDisplay(val)}
                  onValueCommit={([val]) => onSettingsChange({ ...settings, candleLimit: val })}
                  min={50}
                  max={500}
                  step={50}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
