import { useState, useEffect, useCallback } from 'react';
import { CandleData, MarketSettings, INDICATOR_CONFIGS } from '@/types/indicators';
import { toast } from 'sonner';

// Read env vars lazily to ensure they're available after Vite processes them
const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL || 'https://pabyskwdxspzcsjqqlxv.supabase.co',
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYnlza3dkeHNwemNzanFxbHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTc5ODUsImV4cCI6MjA4MjE3Mzk4NX0.5sgUTr--RxyGf9zxtm4DvVqTY26CKRZmsCNf4wIBie4'
});

// Map frontend exchange names to API-supported exchanges
const exchangeMap: Record<string, string> = {
  'Kraken': 'kraken',
  'Coinbase': 'coinbase',
  'CoinGecko': 'coingecko',
  'KuCoin': 'kucoin',
  'GateIO': 'gateio',
};

// Build indicator config for API
const buildIndicatorConfig = (
  indicatorId: string,
  parameters: Record<string, number>
) => {
  const config = INDICATOR_CONFIGS.find(c => c.id === indicatorId);
  if (!config) return null;

  const apiConfig: Record<string, unknown> = {
    name: config.apiName,
  };

  // Add parameters based on indicator type
  switch (indicatorId) {
    case 'rsi':
    case 'sma':
    case 'ema':
    case 'adx':
    case 'atr':
    case 'stochrsi':
      apiConfig.period = parameters.period || 14;
      break;
    case 'macd':
      apiConfig.fast = parameters.fastPeriod || 12;
      apiConfig.slow = parameters.slowPeriod || 26;
      apiConfig.signal = parameters.signalPeriod || 9;
      break;
    case 'bbands':
      apiConfig.period = parameters.period || 20;
      apiConfig.stddev = parameters.stdDev || 2;
      break;
    case 'stoch':
      apiConfig.kPeriod = parameters.kPeriod || 14;
      apiConfig.dPeriod = parameters.dPeriod || 3;
      apiConfig.smoothing = 3;
      break;
    case 'support_resistance':
      apiConfig.lookback = 20;
      break;
  }

  return apiConfig;
};

// Transform API response to our format
const transformIndicatorData = (
  apiResponse: Record<string, unknown>
): Record<string, Record<string, number[]>> => {
  const result: Record<string, Record<string, number[]>> = {};

  Object.entries(apiResponse).forEach(([key, data]) => {
    const lowerKey = key.toLowerCase();
    
    if (typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      
      // Handle different indicator response formats
      if (lowerKey === 'rsi' && Array.isArray(dataObj.values)) {
        result.rsi = { value: dataObj.values as number[] };
      } else if (lowerKey === 'sma' && Array.isArray(dataObj.values)) {
        result.sma = { value: dataObj.values as number[] };
      } else if (lowerKey === 'ema' && Array.isArray(dataObj.values)) {
        result.ema = { value: dataObj.values as number[] };
      } else if (lowerKey === 'macd') {
        result.macd = {
          macd: (dataObj.macd || dataObj.values) as number[] || [],
          signal: (dataObj.signal || []) as number[],
          histogram: (dataObj.histogram || []) as number[],
        };
      } else if (lowerKey === 'bbands') {
        result.bbands = {
          upper: (dataObj.upper || []) as number[],
          middle: (dataObj.middle || []) as number[],
          lower: (dataObj.lower || []) as number[],
        };
      } else if (lowerKey === 'adx' && Array.isArray(dataObj.values)) {
        result.adx = { value: dataObj.values as number[] };
      } else if (lowerKey === 'atr' && Array.isArray(dataObj.values)) {
        result.atr = { value: dataObj.values as number[] };
      } else if (lowerKey === 'obv' && Array.isArray(dataObj.values)) {
        result.obv = { value: dataObj.values as number[] };
      } else if (lowerKey === 'stoch') {
        result.stoch = {
          k: (dataObj.k || []) as number[],
          d: (dataObj.d || []) as number[],
        };
      } else if (lowerKey === 'stochrsi') {
        result.stochrsi = {
          k: (dataObj.k || dataObj.values || []) as number[],
          d: (dataObj.d || []) as number[],
        };
      }
    }
  });

  return result;
};

// Direct fetch to edge function
const callEdgeFunction = async (endpoint: string, payload: unknown) => {
  const config = getSupabaseConfig();
  const url = `${config.url}/functions/v1/trading-proxy`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`,
    },
    body: JSON.stringify({ endpoint, payload }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${errorText}`);
  }

  return response.json();
};

export const useMarketData = (
  settings: MarketSettings,
  selectedIndicators: string[],
  parameters: Record<string, Record<string, number>>
) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [indicatorData, setIndicatorData] = useState<Record<string, Record<string, number[]>>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const exchange = exchangeMap[settings.exchange] || 'kraken';

      // Fetch candles
      const candlesPayload = {
        coin: settings.coin,
        exchange,
        interval: settings.timeframe,
        limit: settings.candleLimit,
      };

      console.log('Fetching candles:', candlesPayload);

      let candlesResponse;
      try {
        candlesResponse = await callEdgeFunction('candles', candlesPayload);
      } catch (fetchError) {
        // Handle rate limiting - keep existing data if we have it
        if (candles.length > 0) {
          console.warn('Rate limited, keeping existing data');
          toast.info('API rate limited. Showing cached data.');
          setIsLoading(false);
          return;
        }
        throw fetchError;
      }

      if (candlesResponse?.error) {
        // Check if it's a rate limit error
        if (candlesResponse.error.includes('Too many requests')) {
          if (candles.length > 0) {
            toast.info('API rate limited. Showing cached data.');
            setIsLoading(false);
            return;
          }
        }
        throw new Error(candlesResponse.error);
      }

      // Transform candles response
      const rawCandles = candlesResponse?.candles || [];
      console.log('Raw candles from API (first 3):', rawCandles.slice(0, 3));
      
      const candlesData: CandleData[] = rawCandles.map((c: Record<string, unknown>) => {
        // Check if timestamp is in seconds or milliseconds
        const ts = c.timestamp as number;
        // If timestamp is less than a reasonable millisecond value (year 2001), it's in seconds
        const timestamp = ts < 1000000000000 ? ts * 1000 : ts;
        
        return {
          timestamp,
          open: c.open as number || 0,
          high: c.high as number || 0,
          low: c.low as number || 0,
          close: c.close as number || 0,
          volume: c.volume as number || 0,
        };
      });

      // Sort by timestamp to ensure chronological order
      candlesData.sort((a, b) => a.timestamp - b.timestamp);
      
      console.log('Processed candles (first 3):', candlesData.slice(0, 3).map(c => ({
        date: new Date(c.timestamp).toISOString(),
        timestamp: c.timestamp
      })));

      setCandles(candlesData);

      // Fetch indicators if any selected
      if (selectedIndicators.length > 0) {
        const indicatorConfigs = selectedIndicators
          .map(id => buildIndicatorConfig(id, parameters[id] || {}))
          .filter(Boolean);

        if (indicatorConfigs.length > 0) {
          const indicatorsPayload = {
            coin: settings.coin,
            exchange,
            interval: settings.timeframe,
            limit: settings.candleLimit,
            indicators: indicatorConfigs,
          };

          console.log('Fetching indicators:', indicatorsPayload);

          const indicatorsResponse = await callEdgeFunction('indicators', indicatorsPayload);

          if (indicatorsResponse?.error) {
            console.error('Indicators API error:', indicatorsResponse.error);
          } else {
            const transformedIndicators = transformIndicatorData(indicatorsResponse || {});
            setIndicatorData(transformedIndicators);
          }
        }
      } else {
        setIndicatorData({});
      }

      toast.success('Data loaded from API');
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [settings, selectedIndicators, parameters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { candles, indicatorData, isLoading, refetch: fetchData };
};
