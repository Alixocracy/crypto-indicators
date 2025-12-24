import { useState, useEffect, useCallback, useRef } from 'react';
import { CandleData, MarketSettings, INDICATOR_CONFIGS } from '@/types/indicators';
import { toast } from 'sonner';

// Read env vars lazily to ensure they're available after Vite processes them
const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL || 'https://pabyskwdxspzcsjqqlxv.supabase.co',
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhYnlza3dkeHNwemNzanFxbHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTc5ODUsImV4cCI6MjA4MjE3Mzk4NX0.5sgUTr--RxyGf9zxtm4DvVqTY26CKRZmsCNf4wIBie4'
});

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRateLimitedRef = useRef(false);

  // Stable reference for settings/indicators
  const settingsRef = useRef(settings);
  const indicatorsRef = useRef(selectedIndicators);
  const parametersRef = useRef(parameters);

  useEffect(() => {
    settingsRef.current = settings;
    indicatorsRef.current = selectedIndicators;
    parametersRef.current = parameters;
  }, [settings, selectedIndicators, parameters]);

  const fetchData = useCallback(async (force = false) => {
    // Rate limit check
    const now = Date.now();
    if (!force && now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log('Skipping request - rate limited');
      return;
    }

    // If currently rate limited by API, don't retry immediately
    if (isRateLimitedRef.current && !force) {
      console.log('Skipping request - API rate limited');
      return;
    }

    lastRequestTime = now;
    setIsLoading(true);

    try {
      const currentSettings = settingsRef.current;
      const currentIndicators = indicatorsRef.current;
      const currentParameters = parametersRef.current;
      
      const exchange = exchangeMap[currentSettings.exchange] || 'kraken';

      // Fetch candles
      const candlesPayload = {
        coin: currentSettings.coin,
        exchange,
        interval: currentSettings.timeframe,
        limit: currentSettings.candleLimit,
      };

      console.log('Fetching candles:', candlesPayload);

      let candlesResponse;
      try {
        candlesResponse = await callEdgeFunction('candles', candlesPayload);
        isRateLimitedRef.current = false;
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : '';
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit')) {
          isRateLimitedRef.current = true;
          if (candles.length > 0) {
            toast.info('API rate limited. Showing cached data.');
            setIsLoading(false);
            return;
          }
        }
        throw fetchError;
      }

      if (candlesResponse?.error) {
        if (candlesResponse.error.includes('Too many requests')) {
          isRateLimitedRef.current = true;
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
      
      const candlesData: CandleData[] = rawCandles.map((c: Record<string, unknown>) => {
        const ts = c.timestamp as number;
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

      candlesData.sort((a, b) => a.timestamp - b.timestamp);
      setCandles(candlesData);

      // Fetch indicators if any selected
      if (currentIndicators.length > 0) {
        const indicatorConfigs = currentIndicators
          .map(id => buildIndicatorConfig(id, currentParameters[id] || {}))
          .filter(Boolean);

        if (indicatorConfigs.length > 0) {
          const indicatorsPayload = {
            coin: currentSettings.coin,
            exchange,
            interval: currentSettings.timeframe,
            limit: currentSettings.candleLimit,
            indicators: indicatorConfigs,
          };

          try {
            const indicatorsResponse = await callEdgeFunction('indicators', indicatorsPayload);
            if (indicatorsResponse?.error) {
              console.error('Indicators API error:', indicatorsResponse.error);
            } else {
              const transformedIndicators = transformIndicatorData(indicatorsResponse || {});
              setIndicatorData(transformedIndicators);
            }
          } catch (indError) {
            console.error('Indicators fetch error:', indError);
          }
        }
      } else {
        setIndicatorData({});
      }

      toast.success('Data loaded');
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (candles.length === 0) {
        toast.error(error instanceof Error ? error.message : 'Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [candles.length]);

  // Debounced effect for settings changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [settings.coin, settings.exchange, settings.timeframe, settings.candleLimit, selectedIndicators.join(','), JSON.stringify(parameters)]);

  return { candles, indicatorData, isLoading, refetch: () => fetchData(true) };
};
