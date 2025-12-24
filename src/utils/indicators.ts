// Client-side indicator calculations using candle data

import { CandleData } from '@/types/indicators';
export type { CandleData } from '@/types/indicators';

// Simple Moving Average
export function calculateSMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      result.push(sum / period);
    }
  }
  
  return result;
}

// Exponential Moving Average
export function calculateEMA(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    result.push(null);
    sum += candles[i].close;
  }
  
  // First EMA is just SMA
  let ema = sum / period;
  result[period - 1] = ema;
  
  // Calculate EMA for rest
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i].close - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

// Bollinger Bands
export function calculateBollingerBands(
  candles: CandleData[], 
  period: number, 
  stdDev: number
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      // Calculate SMA
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      const sma = sum / period;
      
      // Calculate standard deviation
      let squaredDiffSum = 0;
      for (let j = 0; j < period; j++) {
        squaredDiffSum += Math.pow(candles[i - j].close - sma, 2);
      }
      const std = Math.sqrt(squaredDiffSum / period);
      
      upper.push(sma + stdDev * std);
      middle.push(sma);
      lower.push(sma - stdDev * std);
    }
  }
  
  return { upper, middle, lower };
}

// RSI
export function calculateRSI(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  result.push(null); // First candle has no RSI
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First RSI calculation uses simple average
      let avgGain = 0;
      let avgLoss = 0;
      for (let j = 0; j < period; j++) {
        avgGain += gains[i - j];
        avgLoss += losses[i - j];
      }
      avgGain /= period;
      avgLoss /= period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      // Smoothed RSI
      const prevRSI = result[result.length - 1];
      if (prevRSI === null) {
        result.push(null);
        continue;
      }
      
      // Calculate smoothed averages
      let avgGain = 0;
      let avgLoss = 0;
      for (let j = 0; j < period; j++) {
        avgGain += gains[i - j];
        avgLoss += losses[i - j];
      }
      avgGain /= period;
      avgLoss /= period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  
  return result;
}

// ATR (Average True Range)
export function calculateATR(candles: CandleData[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const trueRanges: number[] = [];
  
  // Calculate True Range for each candle
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trueRanges.push(candles[i].high - candles[i].low);
    } else {
      const highLow = candles[i].high - candles[i].low;
      const highClose = Math.abs(candles[i].high - candles[i - 1].close);
      const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }
  }
  
  // Calculate ATR
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += trueRanges[i - j];
      }
      result.push(sum / period);
    }
  }
  
  return result;
}

// Calculate all indicators based on selection
export function calculateIndicators(
  candles: CandleData[],
  selectedIndicators: string[],
  parameters: Record<string, Record<string, number>>
): Record<string, Record<string, (number | null)[]>> {
  const result: Record<string, Record<string, (number | null)[]>> = {};
  
  for (const indicatorId of selectedIndicators) {
    const params = parameters[indicatorId] || {};
    
    switch (indicatorId) {
      case 'sma': {
        const period = params.period || 20;
        result.sma = { value: calculateSMA(candles, period) };
        break;
      }
      case 'ema': {
        const period = params.period || 20;
        result.ema = { value: calculateEMA(candles, period) };
        break;
      }
      case 'bbands': {
        const period = params.period || 20;
        const stdDev = params.stdDev || 2;
        result.bbands = calculateBollingerBands(candles, period, stdDev);
        break;
      }
      case 'rsi': {
        const period = params.period || 14;
        result.rsi = { value: calculateRSI(candles, period) };
        break;
      }
      case 'atr': {
        const period = params.period || 14;
        result.atr = { value: calculateATR(candles, period) };
        break;
      }
    }
  }
  
  return result;
}
