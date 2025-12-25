import { Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { INDICATOR_CONFIGS, CandleData } from '@/types/indicators';
import { cn } from '@/lib/utils';
import { PatternHint } from '@/utils/events';

interface InsightPanelProps {
  selectedIndicators: string[];
  indicatorData: Record<string, Record<string, number[]>>;
  candles: CandleData[];
  parameters: Record<string, Record<string, number>>;
  patternHints?: PatternHint[];
}

interface Insight {
  indicator: string;
  title: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  warning?: string;
}

const InsightPanel = ({ selectedIndicators, indicatorData, candles, parameters, patternHints = [] }: InsightPanelProps) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    const lastCandle = candles[candles.length - 1];
    
    if (!lastCandle) return insights;

    selectedIndicators.forEach(id => {
      const config = INDICATOR_CONFIGS.find(c => c.id === id);
      if (!config) return;

      const data = indicatorData[id];
      if (!data) return;

      switch (id) {
        case 'rsi': {
          const rsiValue = data.value?.[data.value.length - 1];
          if (rsiValue !== undefined) {
            if (rsiValue > 70) {
              insights.push({
                indicator: 'RSI',
                title: `RSI at ${rsiValue.toFixed(1)} — Market stretched high`,
                description: 'This means buyers have been aggressive lately. Think of it like a rubber band pulled tight.',
                sentiment: 'neutral',
                warning: "This is NOT a 'sell signal'. Strong uptrends can stay overbought for weeks. It just means the market is extended."
              });
            } else if (rsiValue < 30) {
              insights.push({
                indicator: 'RSI',
                title: `RSI at ${rsiValue.toFixed(1)} — Market stretched low`,
                description: 'Sellers have been in control. The rubber band is pulled down.',
                sentiment: 'neutral',
                warning: "This is NOT a 'buy signal'. Downtrends can stay oversold for a long time. Context matters!"
              });
            } else {
              insights.push({
                indicator: 'RSI',
                title: `RSI at ${rsiValue.toFixed(1)} — Balanced zone`,
                description: 'Neither stretched high nor low. The market is in a neutral state.',
                sentiment: 'neutral'
              });
            }
          }
          break;
        }
        case 'macd': {
          const macdLine = data.macd?.[data.macd.length - 1];
          const signalLine = data.signal?.[data.signal.length - 1];
          const histogram = data.histogram?.[data.histogram.length - 1];
          if (macdLine !== undefined && signalLine !== undefined) {
            const isBullish = macdLine > signalLine;
            const momentumStrength = Math.abs(histogram || 0);
            insights.push({
              indicator: 'MACD',
              title: `MACD ${isBullish ? 'above' : 'below'} signal line`,
              description: isBullish 
                ? 'Short-term momentum is positive relative to longer-term. The fast average is above the slow.'
                : 'Short-term momentum is negative. The fast average is below the slow.',
              sentiment: isBullish ? 'bullish' : 'bearish',
              warning: 'MACD crossovers LAG behind price. They confirm what happened, not what will happen.'
            });
          }
          break;
        }
        case 'sma':
        case 'ema': {
          const maValue = data.value?.[data.value.length - 1];
          if (maValue !== undefined) {
            const isAbove = lastCandle.close > maValue;
            const maType = id === 'sma' ? 'SMA' : 'EMA';
            const period = parameters[id]?.period || (id === 'sma' ? 20 : 20);
            insights.push({
              indicator: maType,
              title: `Price ${isAbove ? 'above' : 'below'} ${period}-period ${maType}`,
              description: isAbove
                ? `Current price is above the ${period}-period average. Often seen as short-term strength.`
                : `Current price is below the ${period}-period average. Price has been weaker than recent average.`,
              sentiment: isAbove ? 'bullish' : 'bearish',
              warning: "Moving averages lag behind price. They show where price HAS been, not where it's going."
            });
          }
          break;
        }
        case 'bbands': {
          const upper = data.upper?.[data.upper.length - 1];
          const lower = data.lower?.[data.lower.length - 1];
          const middle = data.middle?.[data.middle.length - 1];
          if (upper && lower && middle) {
            const bandwidth = ((upper - lower) / middle) * 100;
            const position = lastCandle.close > middle ? 'upper half' : 'lower half';
            insights.push({
              indicator: 'Bollinger Bands',
              title: `Price in ${position} of bands`,
              description: bandwidth > 10 
                ? `Bands are wide (${bandwidth.toFixed(1)}% spread) — volatility is elevated.`
                : `Bands are narrow (${bandwidth.toFixed(1)}% spread) — volatility is compressed. Big moves often follow squeezes.`,
              sentiment: 'neutral',
              warning: 'Price can "walk the band" in strong trends. Touching the upper band in an uptrend is normal, not a sell signal.'
            });
          }
          break;
        }
        case 'adx': {
          const adxValue = data.value?.[data.value.length - 1];
          if (adxValue !== undefined) {
            insights.push({
              indicator: 'ADX',
              title: `ADX at ${adxValue.toFixed(1)} — ${adxValue > 25 ? 'Trending' : 'Ranging'} market`,
              description: adxValue > 25
                ? 'A strong trend is in place. This could be UP or DOWN — ADX only measures strength, not direction.'
                : 'The market is choppy or sideways. Trend-following strategies may struggle here.',
              sentiment: 'neutral',
              warning: 'High ADX in a downtrend still means strong trend. ADX rising while price falls = strong downtrend!'
            });
          }
          break;
        }
        case 'atr': {
          const atrValue = data.value?.[data.value.length - 1];
          if (atrValue !== undefined) {
            const atrPercent = (atrValue / lastCandle.close) * 100;
            insights.push({
              indicator: 'ATR',
              title: `ATR is ${atrPercent.toFixed(2)}% of price`,
              description: `Average range per candle. Useful for sizing positions and setting stop-losses, not for direction.`,
              sentiment: 'neutral',
              warning: 'ATR shows volatility, NOT direction. A high ATR just means big moves are happening.'
            });
          }
          break;
        }
      }
    });

    return insights;
  };

  const insights = generateInsights();

  if (selectedIndicators.length === 0) {
    return (
      <div className="gradient-border rounded-xl p-5 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select indicators to see insights</p>
          <p className="text-xs mt-1 opacity-75">We'll translate the numbers into plain language</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="gradient-border rounded-xl p-5 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-border rounded-xl p-5 space-y-4 overflow-y-auto max-h-[500px]">
      <div className="flex items-center gap-2 text-foreground sticky top-0 bg-card pb-2 border-b border-border/50">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h2 className="font-semibold">What the indicators are saying</h2>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-2 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {insight.sentiment === 'bullish' && <TrendingUp className="w-4 h-4 text-chart-up" />}
                {insight.sentiment === 'bearish' && <TrendingDown className="w-4 h-4 text-chart-down" />}
                {insight.sentiment === 'neutral' && <Minus className="w-4 h-4 text-muted-foreground" />}
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  insight.sentiment === 'bullish' && 'bg-chart-up/20 text-chart-up',
                  insight.sentiment === 'bearish' && 'bg-chart-down/20 text-chart-down',
                  insight.sentiment === 'neutral' && 'bg-muted text-muted-foreground'
                )}>
                  {insight.indicator}
                </span>
              </div>
            </div>
            
            <h3 className="font-medium text-foreground text-sm">{insight.title}</h3>
            <p className="text-xs text-muted-foreground">{insight.description}</p>
            
            {insight.warning && (
              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border/30">
                <AlertTriangle className="w-3.5 h-3.5 text-momentum shrink-0 mt-0.5" />
                <p className="text-xs text-momentum/80">{insight.warning}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {patternHints.length > 0 && (
        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Pattern hints</h3>
          </div>
          <div className="space-y-2">
            {patternHints.map((hint, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full',
                    hint.severity === 'watch' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'
                  )}>
                    {hint.severity === 'watch' ? 'Watch' : 'Info'}
                  </span>
                  <span className="font-medium text-foreground">{hint.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{hint.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-center text-muted-foreground/70 italic">
          Remember: Indicators describe the current state. They don't predict the future.
        </p>
      </div>
    </div>
  );
};

export default InsightPanel;
