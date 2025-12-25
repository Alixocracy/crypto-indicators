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
  details?: string;
  examples?: string[];
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
    details: 'RSI compares average gains vs losses. Above 50 generally aligns with upward momentum; below 50 with downward momentum.',
    examples: [
      'RSI climbs from 40→55 while price reclaims EMA — momentum is turning constructive.',
      'RSI stays above 60 during shallow pullbacks — often seen in strong uptrends.'
    ],
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
    details: 'MACD line crossing the signal shows fast momentum overtaking or lagging the slower average. Histogram height shows the strength of that spread.',
    examples: [
      'MACD crosses above signal below zero, histogram rising — momentum flipping up from weak levels.',
      'MACD above zero but histogram shrinking — up-move still intact but cooling.'
    ],
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
    details: 'High readings mean closes near recent highs; low readings near recent lows. Useful for range context when paired with trend filters.',
    examples: [
      'Stoch rises from 20→60 while price holds above EMA — recovering momentum inside an uptrend.',
      'Stoch pinned above 80 in a strong rally — normal in trend; not automatically overbought.'
    ],
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
    details: 'Highly reactive view of RSI swings. Great for spotting micro shifts, but noisy without higher-timeframe filters.',
    examples: [
      'Stoch RSI crosses above 20 while RSI itself is rising through 50 — early hint of momentum pickup.',
      'Multiple fast flips while price chops sideways — expect noise; lean on higher-timeframe context.'
    ],
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
    details: 'Rising OBV alongside price suggests buyers are supporting the move; divergences can hint at hidden strength/weakness.',
    examples: [
      'Price flat but OBV rising — quiet accumulation.',
      'Price making new highs but OBV flat — momentum may lack volume confirmation.'
    ],
    commonMistakes: 'OBV divergences from price can take a long time to resolve. It\'s a leading indicator but requires patience.',
    parameters: []
  },
  {
    id: 'sma',
    name: 'SMA',
    category: 'trend',
    apiName: 'SMA',
    description: 'Simple Moving Average smooths price data by calculating the average over a specified period. Great for identifying trend direction.',
    details: 'SMA weights all candles equally. Rising SMA with price above it often signals constructive trend context.',
    examples: [
      'Price rides above a rising 20-SMA — constructive uptrend.',
      'Repeated rejections at a flat 50-SMA — range or weakening trend.'
    ],
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
    details: 'EMA reacts faster to new moves; good for momentum but more prone to whipsaws in chop.',
    examples: [
      'Price reclaims the 21-EMA and holds higher lows above it — momentum flip to the upside.',
      'Choppy price whipsaws through EMA — ignore single crosses; look for structure.'
    ],
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
    details: 'Rising ADX means directional strength is increasing (up or down). Falling ADX often aligns with ranges or slowdowns.',
    examples: [
      'Price below EMA with ADX > 25 — strong downside trend context.',
      'ADX fades from 30 to 20 while price chops around EMA — trend losing strength; range risk.'
    ],
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
    details: 'Band width shows volatility. Middle band is the moving average baseline. Touches alone aren’t signals; context matters.',
    examples: [
      'Band width tightens under ~6% with flat price — squeeze; watch for expansion.',
      'Price walking the upper band with rising width — strong up-move; touch is normal, not a sell.'
    ],
    commonMistakes: 'Price can "walk the band" in strong trends. Touching upper band doesn\'t mean overbought in an uptrend.',
    parameters: [
      { name: 'period', label: 'Period', min: 10, max: 30, default: 20, step: 1 },
      { name: 'stdDev', label: 'Std Deviation', min: 1, max: 3, default: 2, step: 0.5 }
    ]
  },
  {
    id: 'support_resistance',
    name: 'Support / Resistance',
    category: 'volatility',
    apiName: 'SUPPORT_RESISTANCE',
    description: 'Key price levels where buyers (support) or sellers (resistance) have historically been active.',
    details: 'Levels often act as zones. Look for multiple touches and reactions in volume/price speed.',
    examples: [
      'Price bounces twice near the same area with wicks — support zone.',
      'Break above resistance then quick retest and hold — old resistance acting as new support.'
    ],
    commonMistakes: 'S/R levels are zones, not exact prices. Price often overshoots before reversing — don\'t trade exact touches.',
    parameters: []
  },
  {
    id: 'atr',
    name: 'ATR',
    category: 'volatility',
    apiName: 'ATR',
    description: 'Average True Range measures volatility by looking at the range of each candle. Higher ATR = higher volatility.',
    details: 'ATR shows average range size; ATR as % of price helps compare across assets. Higher ATR means you may need wider stops.',
    examples: [
      'ATR is 1.2% of price and falling — calmer environment; tighter stops possible.',
      'ATR jumps to 3% of price — expect wider swings; size positions accordingly.'
    ],
    commonMistakes: 'ATR doesn\'t indicate direction. It\'s useful for position sizing and setting stop-losses, not predicting moves.',
    parameters: [
      { name: 'period', label: 'Period', min: 7, max: 28, default: 14, step: 1 }
    ]
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
