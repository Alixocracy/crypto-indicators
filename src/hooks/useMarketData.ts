import { useState, useEffect, useCallback } from 'react';
import { CandleData, MarketSettings, INDICATOR_CONFIGS } from '@/types/indicators';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      const { data: candlesResponse, error: candlesError } = await supabase.functions.invoke('trading-proxy', {
        body: { endpoint: 'candles', payload: candlesPayload }
      });

      if (candlesError) {
        throw new Error(`Failed to fetch candles: ${candlesError.message}`);
      }

      if (candlesResponse?.error) {
        throw new Error(candlesResponse.error);
      }

      // Transform candles response
      const candlesData: CandleData[] = (candlesResponse?.candles || []).map((c: Record<string, unknown>) => ({
        timestamp: (c.timestamp as number) * 1000 || Date.now(),
        open: c.open as number || 0,
        high: c.high as number || 0,
        low: c.low as number || 0,
        close: c.close as number || 0,
        volume: c.volume as number || 0,
      }));

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

          const { data: indicatorsResponse, error: indicatorsError } = await supabase.functions.invoke('trading-proxy', {
            body: { endpoint: 'indicators', payload: indicatorsPayload }
          });

          if (indicatorsError) {
            console.error('Indicators error:', indicatorsError);
          } else if (indicatorsResponse?.error) {
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
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }, [settings, selectedIndicators, parameters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { candles, indicatorData, isLoading, refetch: fetchData };
};
