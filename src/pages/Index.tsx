import { useState } from 'react';
import Header from '@/components/Header';
import SettingsPanel from '@/components/SettingsPanel';
import IndicatorSelector from '@/components/IndicatorSelector';
import ParameterSliders from '@/components/ParameterSliders';
import CandlestickChart from '@/components/CandlestickChart';
import InsightPanel from '@/components/InsightPanel';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketSettings, INDICATOR_CONFIGS, PRESETS } from '@/types/indicators';
import { Loader2, BookOpen, RefreshCw, Activity, TrendingUp, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const presetConfig = {
  momentum: { icon: Activity, label: 'Momentum' },
  trend: { icon: TrendingUp, label: 'Trend' },
  volatility: { icon: Waves, label: 'Volatility' }
};

const Index = () => {
  const [settings, setSettings] = useState<MarketSettings>({
    coin: 'BTC',
    exchange: 'Kraken',
    timeframe: '1h',
    candleLimit: 100
  });

  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['rsi', 'sma']);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  const [parameters, setParameters] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    INDICATOR_CONFIGS.forEach(config => {
      initial[config.id] = {};
      config.parameters.forEach(param => {
        initial[config.id][param.name] = param.default;
      });
    });
    return initial;
  });

  const { candles, indicatorData, isLoading, refetch } = useMarketData(settings, selectedIndicators, parameters);

  const handleParameterChange = (indicatorId: string, paramName: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [paramName]: value
      }
    }));
  };

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    setSelectedIndicators(PRESETS[presetName]);
    setActivePreset(presetName);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Top Banner - Welcome + Market Settings */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium">Welcome to the Playground!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is a learning tool, not a trading system. Explore how indicators work.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <SettingsPanel settings={settings} onSettingsChange={setSettings} inline />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Indicators */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-4">
              <IndicatorSelector 
                selectedIndicators={selectedIndicators} 
                onSelectionChange={(indicators) => {
                  setSelectedIndicators(indicators);
                  setActivePreset(null);
                }} 
              />
            </div>
          </div>

          {/* Center - Chart + Parameters */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            <div className="gradient-border rounded-xl p-3 h-[450px] flex flex-col animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-foreground text-sm">{settings.coin}/USDT</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {settings.timeframe}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => {
                    const config = presetConfig[preset];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={preset}
                        variant="ghost"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          'h-7 px-2 gap-1 text-xs',
                          activePreset === preset && 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{config.label}</span>
                      </Button>
                    );
                  })}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refetch}
                    disabled={isLoading}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <CandlestickChart 
                    candles={candles}
                    selectedIndicators={selectedIndicators}
                    indicatorData={indicatorData}
                  />
                </div>
              )}
            </div>
            
            {/* Parameters below chart */}
            <ParameterSliders 
              selectedIndicators={selectedIndicators}
              parameters={parameters}
              onParameterChange={handleParameterChange}
            />
          </div>

          {/* Right Sidebar - Insights */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-4">
              <InsightPanel 
                selectedIndicators={selectedIndicators}
                indicatorData={indicatorData}
                candles={candles}
                parameters={parameters}
              />
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            For educational purposes only. No trading signals or investment advice.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
