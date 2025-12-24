import { useState, useEffect, useCallback } from 'react';
import { CandleData, MarketSettings, INDICATOR_CONFIGS } from '@/types/indicators';

// Generate mock candle data
const generateMockCandles = (settings: MarketSettings): CandleData[] => {
  const candles: CandleData[] = [];
  const now = Date.now();
  const timeframeMs: Record<string, number> = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
    '1w': 604800000
  };

  const interval = timeframeMs[settings.timeframe] || 3600000;
  
  // Base prices for different coins
  const basePrices: Record<string, number> = {
    BTC: 67500,
    ETH: 3750,
    SOL: 185,
    DOGE: 0.35,
    XRP: 2.15,
    ADA: 0.95,
    AVAX: 42,
    LINK: 18.5,
    DOT: 8.2,
    MATIC: 0.58
  };

  let price = basePrices[settings.coin] || 100;
  const volatility = price * 0.015; // 1.5% volatility

  for (let i = settings.candleLimit - 1; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const change = (Math.random() - 0.48) * volatility; // Slight upward bias
    const open = price;
    price = price + change;
    const close = price;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000000 + 500000;

    candles.push({ timestamp, open, high, low, close, volume });
  }

  return candles;
};

// Calculate indicator values
const calculateIndicators = (
  candles: CandleData[],
  selectedIndicators: string[],
  parameters: Record<string, Record<string, number>>
): Record<string, Record<string, number[]>> => {
  const results: Record<string, Record<string, number[]>> = {};
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  selectedIndicators.forEach(id => {
    const config = INDICATOR_CONFIGS.find(c => c.id === id);
    if (!config) return;

    const params = parameters[id] || {};

    switch (id) {
      case 'rsi': {
        const period = params.period || 14;
        const rsiValues = calculateRSI(closes, period);
        results[id] = { value: rsiValues };
        break;
      }
      case 'sma': {
        const period = params.period || 20;
        const smaValues = calculateSMA(closes, period);
        results[id] = { value: smaValues };
        break;
      }
      case 'ema': {
        const period = params.period || 20;
        const emaValues = calculateEMA(closes, period);
        results[id] = { value: emaValues };
        break;
      }
      case 'macd': {
        const fast = params.fastPeriod || 12;
        const slow = params.slowPeriod || 26;
        const signal = params.signalPeriod || 9;
        const macdResult = calculateMACD(closes, fast, slow, signal);
        results[id] = macdResult;
        break;
      }
      case 'bbands': {
        const period = params.period || 20;
        const stdDev = params.stdDev || 2;
        const bbandsResult = calculateBBands(closes, period, stdDev);
        results[id] = bbandsResult;
        break;
      }
      case 'adx': {
        const period = params.period || 14;
        const adxValues = calculateADX(highs, lows, closes, period);
        results[id] = { value: adxValues };
        break;
      }
      case 'atr': {
        const period = params.period || 14;
        const atrValues = calculateATR(highs, lows, closes, period);
        results[id] = { value: atrValues };
        break;
      }
      case 'stoch': {
        const kPeriod = params.kPeriod || 14;
        const dPeriod = params.dPeriod || 3;
        const stochResult = calculateStochastic(highs, lows, closes, kPeriod, dPeriod);
        results[id] = stochResult;
        break;
      }
      case 'stochrsi': {
        const period = params.period || 14;
        const rsiValues = calculateRSI(closes, period);
        const stochRsiResult = calculateStochasticFromValues(rsiValues, period, 3);
        results[id] = stochRsiResult;
        break;
      }
      case 'obv': {
        const obvValues = calculateOBV(closes, volumes);
        results[id] = { value: obvValues };
        break;
      }
    }
  });

  return results;
};

// Helper functions for indicator calculations
function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result[i] = sum / period;
  }
  return result;
}

function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;
  
  for (let i = period; i < data.length; i++) {
    result[i] = (data[i] - result[i - 1]) * multiplier + result[i - 1];
  }
  return result;
}

function calculateRSI(closes: number[], period: number): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  for (let i = period; i < closes.length; i++) {
    let avgGain = 0;
    let avgLoss = 0;
    for (let j = i - period; j < i; j++) {
      avgGain += gains[j];
      avgLoss += losses[j];
    }
    avgGain /= period;
    avgLoss /= period;
    
    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - (100 / (1 + rs));
    }
  }
  return result;
}

function calculateMACD(closes: number[], fast: number, slow: number, signal: number) {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdLine: number[] = new Array(closes.length).fill(NaN);
  
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macdLine[i] = emaFast[i] - emaSlow[i];
    }
  }
  
  const signalLine = calculateEMA(macdLine.map(v => isNaN(v) ? 0 : v), signal);
  const histogram: number[] = new Array(closes.length).fill(NaN);
  
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(macdLine[i]) && !isNaN(signalLine[i])) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }
  
  return { macd: macdLine, signal: signalLine, histogram };
}

function calculateBBands(closes: number[], period: number, stdDevMultiplier: number) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = new Array(closes.length).fill(NaN);
  const lower: number[] = new Array(closes.length).fill(NaN);
  
  for (let i = period - 1; i < closes.length; i++) {
    let sumSquares = 0;
    for (let j = 0; j < period; j++) {
      sumSquares += Math.pow(closes[i - j] - sma[i], 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper[i] = sma[i] + stdDevMultiplier * stdDev;
    lower[i] = sma[i] - stdDevMultiplier * stdDev;
  }
  
  return { upper, middle: sma, lower };
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const trueRanges: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  
  const result: number[] = new Array(closes.length).fill(NaN);
  for (let i = period; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period; j < i; j++) {
      sum += trueRanges[j];
    }
    result[i] = sum / period;
  }
  return result;
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number): number[] {
  // Simplified ADX calculation
  const result: number[] = new Array(closes.length).fill(NaN);
  const atr = calculateATR(highs, lows, closes, period);
  
  for (let i = period * 2; i < closes.length; i++) {
    // Simplified: use ATR as proxy for trend strength
    const trendStrength = (atr[i] / closes[i]) * 1000;
    result[i] = Math.min(50, Math.max(10, 20 + trendStrength));
  }
  return result;
}

function calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number, dPeriod: number) {
  const kValues: number[] = new Array(closes.length).fill(NaN);
  
  for (let i = kPeriod - 1; i < closes.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      highestHigh = Math.max(highestHigh, highs[i - j]);
      lowestLow = Math.min(lowestLow, lows[i - j]);
    }
    kValues[i] = ((closes[i] - lowestLow) / (highestHigh - lowestLow)) * 100;
  }
  
  const dValues = calculateSMA(kValues.map(v => isNaN(v) ? 50 : v), dPeriod);
  
  return { k: kValues, d: dValues };
}

function calculateStochasticFromValues(values: number[], kPeriod: number, dPeriod: number) {
  const kValues: number[] = new Array(values.length).fill(NaN);
  
  for (let i = kPeriod - 1; i < values.length; i++) {
    if (isNaN(values[i])) continue;
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      if (!isNaN(values[i - j])) {
        highest = Math.max(highest, values[i - j]);
        lowest = Math.min(lowest, values[i - j]);
      }
    }
    if (highest !== lowest) {
      kValues[i] = ((values[i] - lowest) / (highest - lowest)) * 100;
    }
  }
  
  const dValues = calculateSMA(kValues.map(v => isNaN(v) ? 50 : v), dPeriod);
  
  return { k: kValues, d: dValues };
}

function calculateOBV(closes: number[], volumes: number[]): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  result[0] = volumes[0];
  
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) {
      result[i] = result[i - 1] + volumes[i];
    } else if (closes[i] < closes[i - 1]) {
      result[i] = result[i - 1] - volumes[i];
    } else {
      result[i] = result[i - 1];
    }
  }
  return result;
}

export const useMarketData = (
  settings: MarketSettings,
  selectedIndicators: string[],
  parameters: Record<string, Record<string, number>>
) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [indicatorData, setIndicatorData] = useState<Record<string, Record<string, number[]>>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const mockCandles = generateMockCandles(settings);
      setCandles(mockCandles);
      
      const indicators = calculateIndicators(mockCandles, selectedIndicators, parameters);
      setIndicatorData(indicators);
      
      setIsLoading(false);
    }, 300);
  }, [settings, selectedIndicators, parameters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { candles, indicatorData, isLoading, refetch: fetchData };
};
