import { useState } from 'react';
import { Sliders, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { INDICATOR_CONFIGS, IndicatorParameter } from '@/types/indicators';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ParameterSlidersProps {
  selectedIndicators: string[];
  parameters: Record<string, Record<string, number>>;
  onParameterChange: (indicatorId: string, paramName: string, value: number) => void;
}

const parameterDescriptions: Record<string, string> = {
  period: 'Number of candles used for calculation. Higher = smoother but slower to react.',
  fastPeriod: 'Fast moving average period. Reacts quickly to price changes.',
  slowPeriod: 'Slow moving average period. Smooths out noise.',
  signalPeriod: 'Signal line smoothing. Lower = more sensitive.',
  kPeriod: 'Main line lookback period.',
  dPeriod: 'Signal line smoothing period.',
  stdDev: 'Standard deviation multiplier. Higher = wider bands.',
};

const ParameterSliders = ({ selectedIndicators, parameters, onParameterChange }: ParameterSlidersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const indicatorsWithParams = INDICATOR_CONFIGS.filter(
    (config) => selectedIndicators.includes(config.id) && config.parameters.length > 0
  );

  if (indicatorsWithParams.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="gradient-border rounded-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors rounded-xl">
          <div className="flex items-center gap-2 text-foreground">
            <Sliders className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Parameters</h2>
            <span className="text-xs text-muted-foreground">
              ({indicatorsWithParams.length} indicator{indicatorsWithParams.length > 1 ? 's' : ''})
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              Adjust settings and see how they affect the indicators.
            </p>

            <div className="space-y-5">
              {indicatorsWithParams.map((indicator) => (
                <div key={indicator.id} className="space-y-3">
                  <div className="text-sm font-medium text-foreground border-b border-border/50 pb-2">
                    {indicator.name}
                  </div>
                  {indicator.parameters.map((param: IndicatorParameter) => (
                    <div key={param.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">{param.label}</Label>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3 text-muted-foreground/50" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[200px]">
                              <p className="text-xs">{parameterDescriptions[param.name] || 'Adjust this parameter to see how it affects the indicator.'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-xs font-medium text-primary">
                          {parameters[indicator.id]?.[param.name] ?? param.default}
                        </span>
                      </div>
                      <Slider
                        value={[parameters[indicator.id]?.[param.name] ?? param.default]}
                        onValueChange={([value]) => onParameterChange(indicator.id, param.name, value)}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        className="py-1"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{param.min}</span>
                        <span className="text-primary/60">default: {param.default}</span>
                        <span>{param.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default ParameterSliders;
