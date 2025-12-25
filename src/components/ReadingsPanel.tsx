import { useMemo } from 'react';
import { CandleData } from '@/types/indicators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, LineChart, Activity, Waves } from 'lucide-react';

type IndicatorDataMap = Record<string, Record<string, (number | null)[]>>;

interface ReadingsPanelProps {
  candles: CandleData[];
  indicatorData: IndicatorDataMap;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDollar = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 10000) return `$${(value / 1000).toFixed(1)}k`;
  if (value >= 1000) return `$${value.toFixed(0)}`;
  return `$${value.toFixed(2)}`;
};

const formatPct = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}%`;
};

const ReadingsPanel = ({ candles, indicatorData }: ReadingsPanelProps) => {
  const lastCandle = candles[candles.length - 1];

  const {
    trendScore,
    trendLabel,
    momentumScore,
    momentumLabel,
    atrPct,
    bandWidth,
    stopDistances
  } = useMemo(() => {
    const emaSeries = indicatorData.ema?.value;
    const rsiSeries = indicatorData.rsi?.value;
    const atrSeries = indicatorData.atr?.value;
    const bbUpper = indicatorData.bbands?.upper;
    const bbLower = indicatorData.bbands?.lower;
    const bbMiddle = indicatorData.bbands?.middle;

    const findLastValid = (arr?: (number | null)[]) => {
      if (!arr) return null;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] != null) return arr[i] as number;
      }
      return null;
    };

    const emaNow = findLastValid(emaSeries);
    const emaPrev = emaSeries && emaSeries.length > 5 ? emaSeries[emaSeries.length - 6] : null;
    const rsiNow = findLastValid(rsiSeries);
    const atrNow = findLastValid(atrSeries);
    const close = lastCandle?.close ?? null;

    let trendScore = null;
    let trendLabel = 'Add EMA to see trend';
    if (emaNow != null && emaPrev != null && close != null) {
      const slopePct = ((emaNow - emaPrev) / emaPrev) * 100;
      const directionUp = close > emaNow;
      trendScore = clamp(Math.abs(slopePct) * 8, 0, 100);
      trendLabel = directionUp ? 'Uptrend context' : 'Downtrend context';
    }

    let momentumScore = null;
    let momentumLabel = 'Add RSI to see momentum';
    if (rsiNow != null) {
      momentumScore = clamp(((rsiNow - 50) / 50) * 50 + 50, 0, 100);
      if (rsiNow > 60) momentumLabel = 'Constructive momentum';
      else if (rsiNow < 40) momentumLabel = 'Defensive momentum';
      else momentumLabel = 'Balanced momentum';
    }

    const atrPct = atrNow != null && close != null ? (atrNow / close) * 100 : null;
    let bandWidth: number | null = null;
    if (bbUpper && bbLower && bbMiddle) {
      const u = findLastValid(bbUpper);
      const l = findLastValid(bbLower);
      const m = findLastValid(bbMiddle);
      if (u != null && l != null && m != null) {
        bandWidth = ((u - l) / m) * 100;
      }
    }

    const stopDistances =
      atrNow != null && close != null
        ? {
            conservative: close - atrNow * 2,
            balanced: close - atrNow * 1.5,
          }
        : null;

    return { trendScore, trendLabel, momentumScore, momentumLabel, atrPct, bandWidth, stopDistances };
  }, [indicatorData, lastCandle]);

  const checklist = useMemo(() => {
    const items: { title: string; body: string; type: 'info' | 'warning' }[] = [];
    const emaSeries = indicatorData.ema?.value;
    const rsiSeries = indicatorData.rsi?.value;
    const ema = emaSeries?.[emaSeries.length - 1] ?? null;
    const rsi = rsiSeries?.[rsiSeries.length - 1] ?? null;

    if (lastCandle && ema != null && rsi != null) {
      const priceAbove = lastCandle.close > ema;
      const nearEma = Math.abs(lastCandle.close - ema) / ema < 0.01;

      if (priceAbove && rsi > 50) {
        items.push({
          title: 'Uptrend context',
          body: 'Price above EMA and RSI > 50 — continuation setups often live here.',
          type: 'info',
        });
      }
      if (!priceAbove && rsi < 50) {
        items.push({
          title: 'Downtrend context',
          body: 'Price below EMA and RSI < 50 — rallies can fail at the EMA.',
          type: 'warning',
        });
      }
      if (nearEma && rsi > 45 && rsi < 55) {
        items.push({
          title: 'Range-like chop',
          body: 'Price near EMA with RSI ~50 — breakouts can whipsaw in ranges.',
          type: 'info',
        });
      }
    } else {
      items.push({
        title: 'Add EMA + RSI',
        body: 'Trend/momentum checklists need EMA and RSI selected.',
        type: 'info',
      });
    }
    return items.slice(0, 3);
  }, [indicatorData, lastCandle]);

  return (
    <div className="space-y-3">
      <Card className="bg-secondary/50 border-border/60">
        <CardHeader className="py-3 pb-1">
          <CardTitle className="text-sm">Readings (educational, not signals)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Trend strength</span>
              <LineChart className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-semibold">
                {trendScore != null ? `${Math.round(trendScore)}/100` : '—'}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {trendLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">EMA slope + price vs EMA.</p>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Momentum bias</span>
              <Activity className="w-4 h-4 text-momentum" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-semibold">
                {momentumScore != null ? `${Math.round(momentumScore)}/100` : '—'}
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {momentumLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Based on RSI relative to 50.</p>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Volatility</span>
              <Waves className="w-4 h-4 text-volatility" />
            </div>
            <div className="mt-1 text-sm font-semibold">
              ATR: {formatPct(atrPct)}{bandWidth != null ? ` • BB width: ${formatPct(bandWidth)}` : ''}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Ranges measure movement size, not direction.</p>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ATR stop example</span>
              <Badge variant="outline" className="text-[11px]">Practice</Badge>
            </div>
            {stopDistances ? (
              <>
                <div className="mt-1 text-sm font-semibold">1.5× ATR: {formatDollar(stopDistances.balanced)}</div>
                <div className="text-[11px] text-muted-foreground">2× ATR: {formatDollar(stopDistances.conservative)}</div>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">Add ATR to see example distances.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/40 border-border/60">
        <CardHeader className="py-3 pb-1">
          <CardTitle className="text-sm">Context checklist (educational only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-card border border-border/60 flex items-start gap-2"
            >
              {item.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              ) : (
                <LineChart className="w-4 h-4 text-primary mt-0.5" />
              )}
              <div>
                <div className="text-xs font-semibold text-foreground">{item.title}</div>
                <p className="text-[11px] text-muted-foreground leading-snug">{item.body}</p>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/80 italic">
            These describe conditions; they are not buy/sell/hold signals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadingsPanel;
