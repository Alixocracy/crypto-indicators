export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  id: string;
  name: string;
  category: 'momentum' | 'trend' | 'volatility';
  description: string;
  commonMistakes: string;
  parameters: IndicatorParameter[];
  apiName: string;
}

export interface IndicatorParameter {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface IndicatorResult {
  indicator: string;
  values: Record<string, number[]>;
  insight: string;
}

export interface MarketSettings {
  coin: string;
  exchange: string;
  timeframe: string;
  candleLimit: number;
}

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    id: 'rsi',
    name: 'RSI',
    category: 'momentum',
    apiName: 'RSI',
    description: 'Relative Strength Index measures the speed and magnitude of recent price changes. It oscillates between 0-100, with readings above 70 considered overbought and below 30 oversold.',
    commonMistakes: 'RSI above 70 doesn\'t mean "sell now" — strong trends can stay overbought for weeks. Use it to understand market stretch, not as a trading trigger.',
    parameters: [
      { name: 'period', label: 'Period', min: 5, max: 30, default: 14, step: 1 }
    ]
  },
  {
    id: 'macd',
    name: 'MACD',
    category: 'momentum',
    apiName: 'MACD',
    description: 'Moving Average Convergence Divergence shows the relationship between two moving averages. The histogram reveals momentum shifts.',
    commonMistakes: 'MACD crossovers lag behind price action. They\'re better for confirming trends than predicting reversals.',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', min: 8, max: 20, default: 12, step: 1 },
      { name: 'slowPeriod', label: 'Slow Period', min: 20, max: 35, default: 26, step: 1 },
      { name: 'signalPeriod', label: 'Signal Period', min: 5, max: 15, default: 9, step: 1 }
    ]
  },
  {
    id: 'stoch',
    name: 'Stochastic',
    category: 'momentum',
    apiName: 'STOCH',
    description: 'Stochastic Oscillator compares closing price to the price range over a period. Shows where price closed relative to recent highs/lows.',
    commonMistakes: 'Like RSI, overbought/oversold readings can persist in strong trends. It\'s about context, not absolutes.',
    parameters: [
      { name: 'kPeriod', label: 'K Period', min: 5, max: 21, default: 14, step: 1 },
      { name: 'dPeriod', label: 'D Period', min: 1, max: 10, default: 3, step: 1 }
    ]
  },
  {
    id: 'stochrsi',
    name: 'Stoch RSI',
    category: 'momentum',
    apiName: 'STOCHRSI',
    description: 'Applies the Stochastic formula to RSI values instead of price. More sensitive than regular RSI.',
    commonMistakes: 'Higher sensitivity means more false signals. Great for spotting short-term shifts, not trend direction.',
    parameters: [
      { name: 'period', label: 'Period', min: 5, max: 21, default: 14, step: 1 }
    ]
  },
  {
    id: 'obv',
    name: 'OBV',
    category: 'momentum',
    apiName: 'OBV',
    description: 'On-Balance Volume adds volume on up days and subtracts on down days. Shows whether volume flows into or out of an asset.',
    commonMistakes: 'OBV divergences from price can take a long time to resolve. It\'s a leading indicator but requires patience.',
    parameters: []
  },
  {
    id: 'sma',
    name: 'SMA',
    category: 'trend',
    apiName: 'SMA',
    description: 'Simple Moving Average smooths price data by calculating the average over a specified period. Great for identifying trend direction.',
    commonMistakes: 'Moving averages lag behind price. They tell you where price has been, not where it\'s going.',
    parameters: [
      { name: 'period', label: 'Period', min: 5, max: 200, default: 20, step: 1 }
    ]
  },
  {
    id: 'ema',
    name: 'EMA',
    category: 'trend',
    apiName: 'EMA',
    description: 'Exponential Moving Average gives more weight to recent prices, making it more responsive than SMA.',
    commonMistakes: 'Faster response = more whipsaws. EMA is great for trends but can generate false signals in choppy markets.',
    parameters: [
      { name: 'period', label: 'Period', min: 5, max: 200, default: 20, step: 1 }
    ]
  },
  {
    id: 'adx',
    name: 'ADX',
    category: 'trend',
    apiName: 'ADX',
    description: 'Average Directional Index measures trend strength, not direction. Above 25 = trending, below 20 = ranging.',
    commonMistakes: 'ADX doesn\'t tell you if the trend is up or down, just how strong it is. High ADX in a downtrend is still a strong trend.',
    parameters: [
      { name: 'period', label: 'Period', min: 7, max: 28, default: 14, step: 1 }
    ]
  },
  {
    id: 'bbands',
    name: 'Bollinger Bands',
    category: 'volatility',
    apiName: 'BBANDS',
    description: 'Bands that expand and contract based on volatility. Price touching the bands shows relative high/low.',
    commonMistakes: 'Price can "walk the band" in strong trends. Touching upper band doesn\'t mean overbought in an uptrend.',
    parameters: [
      { name: 'period', label: 'Period', min: 10, max: 30, default: 20, step: 1 },
      { name: 'stdDev', label: 'Std Deviation', min: 1, max: 3, default: 2, step: 0.5 }
    ]
  },
  {
    id: 'atr',
    name: 'ATR',
    category: 'volatility',
    apiName: 'ATR',
    description: 'Average True Range measures volatility by looking at the range of each candle. Higher ATR = higher volatility.',
    commonMistakes: 'ATR doesn\'t indicate direction. It\'s useful for position sizing and setting stop-losses, not predicting moves.',
    parameters: [
      { name: 'period', label: 'Period', min: 7, max: 28, default: 14, step: 1 }
    ]
  },
  {
    id: 'support_resistance',
    name: 'Support/Resistance',
    category: 'volatility',
    apiName: 'SUPPORT_RESISTANCE',
    description: 'Key price levels where buyers (support) or sellers (resistance) have historically been active.',
    commonMistakes: 'S/R levels are zones, not exact prices. Price often overshoots before reversing — don\'t trade exact touches.',
    parameters: []
  }
];

export const PRESETS = {
  momentum: ['rsi', 'macd', 'obv'],
  trend: ['sma', 'ema', 'adx'],
  volatility: ['bbands', 'atr']
};

export const COINS = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC'];
export const EXCHANGES = ['Kraken', 'Coinbase', 'CoinGecko', 'KuCoin', 'GateIO'];
export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
