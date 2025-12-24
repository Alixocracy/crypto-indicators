import { Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MarketSettings, COINS, EXCHANGES, TIMEFRAMES } from '@/types/indicators';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: MarketSettings;
  onSettingsChange: (settings: MarketSettings) => void;
  inline?: boolean;
}

const SettingsPanel = ({ settings, onSettingsChange, inline = false }: SettingsPanelProps) => {
  if (inline) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Coin</Label>
          <Select 
            value={settings.coin} 
            onValueChange={(value) => onSettingsChange({ ...settings, coin: value })}
          >
            <SelectTrigger className="h-8 w-20 bg-secondary border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COINS.map((coin) => (
                <SelectItem key={coin} value={coin}>{coin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Exchange</Label>
          <Select 
            value={settings.exchange} 
            onValueChange={(value) => onSettingsChange({ ...settings, exchange: value })}
          >
            <SelectTrigger className="h-8 w-24 bg-secondary border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGES.map((exchange) => (
                <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Timeframe</Label>
          <Select 
            value={settings.timeframe} 
            onValueChange={(value) => onSettingsChange({ ...settings, timeframe: value })}
          >
            <SelectTrigger className="h-8 w-16 bg-secondary border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf} value={tf}>{tf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Candles</Label>
          <Select 
            value={String(settings.candleLimit)} 
            onValueChange={(value) => onSettingsChange({ ...settings, candleLimit: Number(value) })}
          >
            <SelectTrigger className="h-8 w-20 bg-secondary border-border/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500].map((num) => (
                <SelectItem key={num} value={String(num)}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-border rounded-xl p-5 space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-foreground">
        <Settings className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">Market Settings</h2>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Coin</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-sm">Choose which cryptocurrency you want to explore. BTC is a great starting point!</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select 
            value={settings.coin} 
            onValueChange={(value) => onSettingsChange({ ...settings, coin: value })}
          >
            <SelectTrigger className="bg-secondary border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COINS.map((coin) => (
                <SelectItem key={coin} value={coin}>{coin}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Exchange</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-sm">Different exchanges can have slightly different prices. Pick any to start!</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select 
            value={settings.exchange} 
            onValueChange={(value) => onSettingsChange({ ...settings, exchange: value })}
          >
            <SelectTrigger className="bg-secondary border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXCHANGES.map((exchange) => (
                <SelectItem key={exchange} value={exchange}>{exchange}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Timeframe</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-sm">Each candle represents this time period. 1h (hourly) is great for learning — not too fast, not too slow.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select 
            value={settings.timeframe} 
            onValueChange={(value) => onSettingsChange({ ...settings, timeframe: value })}
          >
            <SelectTrigger className="bg-secondary border-border/50 hover:border-primary/50 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map((tf) => (
                <SelectItem key={tf} value={tf}>{tf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Candles</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p className="text-sm">How many candles to show. More candles = more history to analyze.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm font-medium text-primary">{settings.candleLimit}</span>
          </div>
          <Slider
            value={[settings.candleLimit]}
            onValueChange={([value]) => onSettingsChange({ ...settings, candleLimit: value })}
            min={50}
            max={500}
            step={50}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50</span>
            <span>500</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
