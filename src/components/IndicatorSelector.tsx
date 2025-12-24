import { Activity, TrendingUp, Waves, Check, Info } from 'lucide-react';
import { INDICATOR_CONFIGS, IndicatorConfig } from '@/types/indicators';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onSelectionChange: (indicators: string[]) => void;
}

const categoryConfig = {
  momentum: {
    icon: Activity,
    label: 'Momentum',
    color: 'text-momentum',
    bgColor: 'bg-momentum/10',
    borderColor: 'border-momentum/30',
    glowClass: 'glow-momentum'
  },
  trend: {
    icon: TrendingUp,
    label: 'Trend',
    color: 'text-trend',
    bgColor: 'bg-trend/10',
    borderColor: 'border-trend/30',
    glowClass: 'glow-trend'
  },
  volatility: {
    icon: Waves,
    label: 'Volatility',
    color: 'text-volatility',
    bgColor: 'bg-volatility/10',
    borderColor: 'border-volatility/30',
    glowClass: 'glow-volatility'
  }
};

const IndicatorSelector = ({ selectedIndicators, onSelectionChange }: IndicatorSelectorProps) => {
  const toggleIndicator = (id: string) => {
    if (selectedIndicators.includes(id)) {
      onSelectionChange(selectedIndicators.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIndicators, id]);
    }
  };

  const groupedIndicators = INDICATOR_CONFIGS.reduce((acc, indicator) => {
    if (!acc[indicator.category]) {
      acc[indicator.category] = [];
    }
    acc[indicator.category].push(indicator);
    return acc;
  }, {} as Record<string, IndicatorConfig[]>);

  return (
    <div className="gradient-border rounded-xl p-4 space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-sm">Indicators</h2>
        <span className="text-xs text-muted-foreground">
          {selectedIndicators.length} selected
        </span>
      </div>

      {/* Category Groups */}
      <div className="space-y-3">
        {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          const indicators = groupedIndicators[category] || [];

          return (
            <div key={category} className="space-y-2">
              <div className={cn('flex items-center gap-2', config.color)}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {indicators.map((indicator) => {
                  const isSelected = selectedIndicators.includes(indicator.id);
                  return (
                    <Tooltip key={indicator.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleIndicator(indicator.id)}
                          className={cn(
                            'relative px-3 py-2 rounded-lg text-left text-sm transition-all duration-200',
                            'border hover:scale-[1.02] active:scale-[0.98]',
                            isSelected
                              ? `${config.bgColor} ${config.borderColor} ${config.color}`
                              : 'bg-secondary/50 border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{indicator.name}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[300px] p-4 space-y-2">
                        <p className="font-medium text-foreground">{indicator.name}</p>
                        <p className="text-sm text-muted-foreground">{indicator.description}</p>
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs text-destructive/80">{indicator.commonMistakes}</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IndicatorSelector;
