import { MarketSettings } from "./indicators";

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  explainer: string[];
  settings: Partial<MarketSettings>;
  indicators: string[];
  details?: string;
  examples?: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "trend-reversal",
    title: "Trend Reversal Anatomy",
    subtitle: "Watch price vs EMA with RSI balance",
    details: "A simple structure for spotting when momentum stops making new highs/lows and begins to flip. EMA provides trend baseline; RSI shows whether momentum is reclaiming strength.",
    examples: [
      "Price closes back above EMA after a lower low, RSI crosses above 50 — potential shift from down to up.",
      "Lower high fails to break EMA and RSI stalls under 50 — bounce likely fading."
    ],
    settings: { coin: "BTC", exchange: "Kraken", timeframe: "4h", candleLimit: 200 },
    indicators: ["ema", "rsi"],
    explainer: [
      "Look for price crossing above/below EMA while RSI leaves extremes.",
      "Higher highs above EMA with RSI > 50 hints momentum shift.",
      "Failed retests of the EMA often show where buyers/sellers defend."
    ]
  },
  {
    id: "range-compression",
    title: "Range Compression",
    subtitle: "Volatility squeeze with Bollinger Bands + ATR",
    details: "Use band width and ATR % to see when the market is coiling. Breakouts after compression can run, but direction still comes from price action.",
    examples: [
      "BB width under ~6% with ATR under 1% of price — coiled, watch for break and retest.",
      "Break above recent highs while bands expand and ATR picks up — potential expansion phase."
    ],
    settings: { coin: "ETH", exchange: "Coinbase", timeframe: "1h", candleLimit: 150 },
    indicators: ["bbands", "atr"],
    explainer: [
      "Band width narrowing shows volatility drying up.",
      "ATR % of price tells how big candles are vs. current level.",
      "Watch for breakouts from the squeeze; direction comes from price, not the bands."
    ]
  },
  {
    id: "momentum-checkup",
    title: "Momentum Checkup",
    subtitle: "Short-term vs long-term balance",
    details: "Contrast short-term momentum with moving average baselines to see if pullbacks are healthy or breaking down.",
    examples: [
      "Price pulls into EMA/SMA zone while RSI stays above 45–50 — constructive pullback.",
      "Price loses both MAs and RSI stays below 50 — momentum likely flipping defensive."
    ],
    settings: { coin: "SOL", exchange: "Kraken", timeframe: "1h", candleLimit: 120 },
    indicators: ["rsi", "sma", "ema"],
    explainer: [
      "Is price riding above both MAs or ping-ponging through them?",
      "RSI > 60 during pullbacks can signal resilient momentum.",
      "Crosses back below MAs after lower highs suggest exhaustion."
    ]
  }
];
