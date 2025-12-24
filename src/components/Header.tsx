import { TrendingUp, Sparkles } from 'lucide-react';

const Header = () => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
        
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            No login needed
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
