import { TrendingUp, Sparkles } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { MarketSettings } from '@/types/indicators';

interface HeaderProps {
  settings: MarketSettings;
  onSettingsChange: (settings: MarketSettings) => void;
}

const Header = ({ settings, onSettingsChange }: HeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Indicator Playground</h1>
            <p className="text-xs text-muted-foreground">Learn, explore, understand</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end w-full lg:w-auto">
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
            No login needed
          </span>
          <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} inline />
        </div>
      </div>
    </header>
  );
};

export default Header;
