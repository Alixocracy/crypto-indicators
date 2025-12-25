import { MarketSettings } from "./indicators";

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  explainer: string[];
  settings: Partial<MarketSettings>;
  indicators: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: "trend-reversal",
    title: "Trend Reversal Anatomy",
    subtitle: "Watch price vs EMA with RSI balance",
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
    settings: { coin: "SOL", exchange: "Kraken", timeframe: "1h", candleLimit: 120 },
    indicators: ["rsi", "sma", "ema"],
    explainer: [
      "Is price riding above both MAs or ping-ponging through them?",
      "RSI > 60 during pullbacks can signal resilient momentum.",
      "Crosses back below MAs after lower highs suggest exhaustion."
    ]
  }
];
