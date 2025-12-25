import { CandleData } from "@/types/indicators";

export interface EventPin {
  index: number;
  timestamp: number;
  label: string;
  detail: string;
  color: string;
}

export interface PatternHint {
  title: string;
  description: string;
  severity: "info" | "watch";
}

const clampEvents = <T>(events: T[], limit = 12) =>
  events.slice(-limit);

export function buildEventPins(
  candles: CandleData[],
  indicatorData: Record<string, Record<string, (number | null)[]>>,
  selectedIndicators: string[]
): EventPin[] {
  const events: EventPin[] = [];
  if (candles.length < 3) return events;

  // Price crosses EMA
  if (selectedIndicators.includes("ema") && indicatorData.ema?.value) {
    const ema = indicatorData.ema.value;
    for (let i = 1; i < candles.length; i++) {
      const prev = ema[i - 1];
      const curr = ema[i];
      if (prev == null || curr == null) continue;
      const prevDiff = candles[i - 1].close - prev;
      const currDiff = candles[i].close - curr;
      if (prevDiff <= 0 && currDiff > 0) {
        events.push({
          index: i,
          timestamp: candles[i].timestamp,
          label: "Price > EMA",
          detail: "Close pushed back above EMA",
          color: "#22C55E"
        });
      } else if (prevDiff >= 0 && currDiff < 0) {
        events.push({
          index: i,
          timestamp: candles[i].timestamp,
          label: "Price < EMA",
          detail: "Close slipped below EMA",
          color: "#EF4444"
        });
      }
    }
  }

  // RSI crosses 50
  if (selectedIndicators.includes("rsi") && indicatorData.rsi?.value) {
    const rsi = indicatorData.rsi.value;
    for (let i = 1; i < candles.length; i++) {
      const prev = rsi[i - 1];
      const curr = rsi[i];
      if (prev == null || curr == null) continue;
      if (prev <= 50 && curr > 50) {
        events.push({
          index: i,
          timestamp: candles[i].timestamp,
          label: "RSI > 50",
          detail: "Momentum flipped constructive",
          color: "#22C55E"
        });
      } else if (prev >= 50 && curr < 50) {
        events.push({
          index: i,
          timestamp: candles[i].timestamp,
          label: "RSI < 50",
          detail: "Momentum flipped defensive",
          color: "#EF4444"
        });
      }
    }
  }

  // Bollinger Band squeeze detection
  if (selectedIndicators.includes("bbands") && indicatorData.bbands?.upper) {
    const upper = indicatorData.bbands.upper;
    const lower = indicatorData.bbands.lower;
    const middle = indicatorData.bbands.middle;
    const squeezeThreshold = 6; // percent of middle
    for (let i = 1; i < candles.length; i++) {
      const u = upper[i];
      const l = lower[i];
      const m = middle[i];
      const prevU = upper[i - 1];
      const prevL = lower[i - 1];
      const prevM = middle[i - 1];
      if (u == null || l == null || m == null || prevU == null || prevL == null || prevM == null) continue;
      const width = ((u - l) / m) * 100;
      const prevWidth = ((prevU - prevL) / prevM) * 100;
      if (prevWidth >= squeezeThreshold && width < squeezeThreshold) {
        events.push({
          index: i,
          timestamp: candles[i].timestamp,
          label: "BB squeeze",
          detail: "Volatility compressed; watch for expansion",
          color: "#A855F7"
        });
      }
    }
  }

  return clampEvents(events);
}

const findSwingPoints = (
  candles: CandleData[],
  lookback = 80
) => {
  const start = Math.max(2, candles.length - lookback);
  const highs: { index: number; price: number }[] = [];
  const lows: { index: number; price: number }[] = [];
  for (let i = start; i < candles.length - 2; i++) {
    const prev = candles[i - 1].close;
    const curr = candles[i].close;
    const next = candles[i + 1].close;
    if (curr > prev && curr > next) {
      highs.push({ index: i, price: curr });
    }
    if (curr < prev && curr < next) {
      lows.push({ index: i, price: curr });
    }
  }
  return { highs, lows };
};

export function detectPatternHints(
  candles: CandleData[],
  indicatorData: Record<string, Record<string, (number | null)[]>>,
  selectedIndicators: string[]
): PatternHint[] {
  const hints: PatternHint[] = [];
  if (candles.length < 20) return hints;

  const { highs, lows } = findSwingPoints(candles);
  const rsi = indicatorData.rsi?.value;

  // RSI-based divergences
  if (selectedIndicators.includes("rsi") && rsi && rsi.length) {
    if (lows.length >= 2) {
      const lastTwo = lows.slice(-2);
      const [first, second] = lastTwo;
      const rsi1 = rsi[first.index];
      const rsi2 = rsi[second.index];
      if (rsi1 != null && rsi2 != null && second.price < first.price && rsi2 > rsi1 + 0.5) {
        hints.push({
          title: "Bullish divergence",
          description: "Price made a lower low while RSI made a higher low — momentum loss, not a guarantee of reversal.",
          severity: "watch"
        });
      }
    }
    if (highs.length >= 2) {
      const lastTwo = highs.slice(-2);
      const [first, second] = lastTwo;
      const rsi1 = rsi[first.index];
      const rsi2 = rsi[second.index];
      if (rsi1 != null && rsi2 != null && second.price > first.price && rsi2 < rsi1 - 0.5) {
        hints.push({
          title: "Bearish divergence",
          description: "Price made a higher high while RSI made a lower high — uptrend momentum is fading.",
          severity: "watch"
        });
      }
    }
  }

  // Bollinger Band squeeze hint
  if (selectedIndicators.includes("bbands") && indicatorData.bbands?.upper) {
    const upper = indicatorData.bbands.upper;
    const lower = indicatorData.bbands.lower;
    const middle = indicatorData.bbands.middle;
    const lastIndex = candles.length - 1;
    const u = upper[lastIndex];
    const l = lower[lastIndex];
    const m = middle[lastIndex];
    if (u != null && l != null && m != null) {
      const width = ((u - l) / m) * 100;
      if (width < 6) {
        hints.push({
          title: "Volatility squeeze",
          description: `Bands are tight (${width.toFixed(1)}% of price). Expansions often follow squeezes; direction still comes from price.`,
          severity: "info"
        });
      }
    }
  }

  return hints.slice(-3);
}
