import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import IndicatorSelector from '@/components/IndicatorSelector';
import ParameterSliders from '@/components/ParameterSliders';
import CandlestickChart from '@/components/CandlestickChart';
import InsightPanel from '@/components/InsightPanel';
import ReadingsPanel from '@/components/ReadingsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarketData } from '@/hooks/useMarketData';
import { MarketSettings, INDICATOR_CONFIGS, PRESETS } from '@/types/indicators';
import { SCENARIOS } from '@/types/scenarios';
import { buildEventPins, detectPatternHints } from '@/utils/events';
import { Loader2, RefreshCw, Activity, TrendingUp, Waves, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('agnic_api_key');
  });
  
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (apiKey) {
      localStorage.setItem('agnic_api_key', apiKey);
    } else {
      localStorage.removeItem('agnic_api_key');
    }
  }, [apiKey]);

  const { candles, indicatorData, isLoading, error, refetch } = useMarketData(settings, selectedIndicators, parameters, apiKey);
  const eventPins = useMemo(
    () => buildEventPins(candles, indicatorData, selectedIndicators),
    [candles, indicatorData, selectedIndicators]
  );
  const patternHints = useMemo(
    () => detectPatternHints(candles, indicatorData, selectedIndicators),
    [candles, indicatorData, selectedIndicators]
  );
  const lastUpdatedText = useMemo(() => {
    if (!candles.length) return '—';
    const date = new Date(candles[candles.length - 1].timestamp);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, [candles]);

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
    setActiveScenario(null);
  };

  const applyScenario = (scenarioId: string) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    setSettings(prev => ({ ...prev, ...scenario.settings }));
    setSelectedIndicators(scenario.indicators);
    setActiveScenario(scenario.id);
    setActivePreset(null);
  };

  const ensureApiKey = () => {
    if (!apiKey) {
      toast.error('Please set your API key to load live data.');
      return false;
    }
    return true;
  };

  const handleSettingsChange = (next: MarketSettings) => {
    if (!ensureApiKey()) return;
    setSettings(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        settings={settings} 
        onSettingsChange={handleSettingsChange} 
        apiKey={apiKey} 
        onApiKeyChange={setApiKey} 
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Mobile quick toggles */}
        <div className="lg:hidden mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Quick toggles</p>
            <div className="flex items-center gap-2">
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => (
                <Button
                  key={preset}
                  variant="secondary"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'h-8 text-xs px-3',
                    activePreset === preset && 'bg-primary/10 text-primary'
                  )}
                >
                  {presetConfig[preset].label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {INDICATOR_CONFIGS.map(indicator => {
              const isSelected = selectedIndicators.includes(indicator.id);
              return (
                <Button
                  key={indicator.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs whitespace-nowrap"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedIndicators(selectedIndicators.filter(id => id !== indicator.id));
                    } else {
                      setSelectedIndicators([...selectedIndicators, indicator.id]);
                    }
                    setActivePreset(null);
                    setActiveScenario(null);
                  }}
                >
                  {indicator.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Scenario cards */}
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Scenario cards</p>
                <p className="text-xs text-muted-foreground">Apply ready-made setups with a learning checklist.</p>
              </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setActiveScenario(null);
                setSelectedIndicators(['rsi', 'sma']);
                setActivePreset(null);
              }}
              className="text-xs"
            >
              Reset
            </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {SCENARIOS.map((scenario, idx) => (
                <button
                  key={scenario.id}
                  onClick={() => applyScenario(scenario.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    'bg-secondary/50 hover:border-primary/40 hover:shadow-sm',
                    activeScenario === scenario.id && 'border-primary/60 shadow-md'
                  )}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">{scenario.title}</p>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="p-1 rounded-full hover:bg-secondary/70 transition-colors"
                            aria-label={`Learn more about ${scenario.title}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{scenario.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <p>{scenario.subtitle}</p>
                            {scenario.details && <p>{scenario.details}</p>}
                            {scenario.explainer?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-foreground mb-1">What to watch:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  {scenario.explainer.map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {scenario.examples?.length ? (
                              <div>
                                <p className="text-xs font-semibold text-foreground mb-1">Examples:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                  {scenario.examples.map((ex, i) => (
                                    <li key={i}>{ex}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {scenario.settings.timeframe}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{scenario.subtitle}</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {scenario.explainer.slice(0, 3).map((line, i) => (
                      <li key={i} className="flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
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
                  setActiveScenario(null);
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
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground">Updated: {lastUpdatedText}</span>
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
                    onClick={() => setShowEvents(!showEvents)}
                    className={cn("h-7 px-2 gap-1", showEvents && "bg-primary/10 text-primary")}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">Events</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      if (!ensureApiKey()) return;
                      refetch();
                    }}
                    disabled={isLoading}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-destructive">API Error</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <CandlestickChart 
                    candles={candles}
                    selectedIndicators={selectedIndicators}
                    indicatorData={indicatorData}
                    eventPins={eventPins}
                    showEvents={showEvents}
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

          {/* Right Sidebar - Tabs */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-4">
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid grid-cols-2 mb-3">
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="readings">Readings</TabsTrigger>
                </TabsList>
                <TabsContent value="insights">
                  <InsightPanel 
                    selectedIndicators={selectedIndicators}
                    indicatorData={indicatorData}
                    candles={candles}
                    parameters={parameters}
                    patternHints={patternHints}
                  />
                </TabsContent>
                <TabsContent value="readings">
                  <ReadingsPanel candles={candles} indicatorData={indicatorData} />
                </TabsContent>
              </Tabs>
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
