import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketSettings } from '@/types/indicators';
import { calculateIndicators, CandleData } from '@/utils/indicators';
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
  const [indicatorData, setIndicatorData] = useState<Record<string, Record<string, (number | null)[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRateLimitedRef = useRef(false);
  const candlesRef = useRef<CandleData[]>([]);

  // Keep candlesRef in sync
  candlesRef.current = candles;

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
        isRateLimitedRef.current = false;
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : '';
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit')) {
          isRateLimitedRef.current = true;
          if (candlesRef.current.length > 0) {
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
          if (candlesRef.current.length > 0) {
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

      // Calculate indicators client-side for accurate historical data
      if (selectedIndicators.length > 0) {
        const calculatedIndicators = calculateIndicators(candlesData, selectedIndicators, parameters);
        setIndicatorData(calculatedIndicators);
      } else {
        setIndicatorData({});
      }

      toast.success('Data loaded');
    } catch (error) {
      console.error('Error fetching market data:', error);
      if (candlesRef.current.length === 0) {
        toast.error(error instanceof Error ? error.message : 'Failed to load data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings, selectedIndicators, parameters]);

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
  }, [fetchData]);

  return { candles, indicatorData, isLoading, refetch: () => fetchData(true) };
};
