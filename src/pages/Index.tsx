import { useState } from 'react';
import Header from '@/components/Header';
import SettingsPanel from '@/components/SettingsPanel';
import IndicatorSelector from '@/components/IndicatorSelector';
import ParameterSliders from '@/components/ParameterSliders';
import CandlestickChart from '@/components/CandlestickChart';
import InsightPanel from '@/components/InsightPanel';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketSettings, INDICATOR_CONFIGS } from '@/types/indicators';
import { Loader2, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [settings, setSettings] = useState<MarketSettings>({
    coin: 'BTC',
    exchange: 'Kraken',
    timeframe: '1h',
    candleLimit: 100
  });

  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['rsi', 'sma']);
  
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Top Banner - Welcome + Market Settings */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex items-start gap-3 flex-1">
              <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground font-medium">Welcome to the Playground!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is a learning tool, not a trading system. Explore how indicators work, what they measure, and 
                  why they don't predict the future. No signals, no advice — just understanding.
                </p>
              </div>
            </div>
            <div className="lg:w-auto">
              <SettingsPanel settings={settings} onSettingsChange={setSettings} inline />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Indicators Only */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <IndicatorSelector 
              selectedIndicators={selectedIndicators} 
              onSelectionChange={setSelectedIndicators} 
            />
          </div>

          {/* Main Chart Area + Parameters */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            <div className="gradient-border rounded-xl p-4 h-[500px] relative animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-foreground">{settings.coin}/USDT</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    {settings.timeframe}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {settings.exchange}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refetch}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              ) : (
                <div className="h-[calc(100%-3rem)]">
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
          <div className="col-span-12 lg:col-span-3">
            <InsightPanel 
              selectedIndicators={selectedIndicators}
              indicatorData={indicatorData}
              candles={candles}
              parameters={parameters}
            />
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            This tool is for educational purposes only. It does not provide trading signals, investment advice, or recommendations.
            Past indicator behavior does not predict future price movements.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
