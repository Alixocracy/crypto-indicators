import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketSettings } from '@/types/indicators';
import { calculateIndicators, CandleData } from '@/utils/indicators';
import { DEFAULT_CANDLES } from '@/data/defaultCandles';
import { toast } from 'sonner';

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

const PROXY_ENDPOINT = 'https://pabyskwdxspzcsjqqlxv.supabase.co/functions/v1/trading-proxy';
const DIRECT_CANDLES_ENDPOINT = 'https://api.agnichub.xyz/v1/custom/trading-indicators/candles';
const SIGN_PAYMENT_ENDPOINT = 'https://api.agnicpay.xyz/api/sign-payment';

type PaymentRequirements = {
  x402Version?: number;
  accepts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

const callX402WithOAuth = async (
  url: string,
  payload: Record<string, unknown>,
  oauthToken: string
) => {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const initial = await fetch(url, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(payload),
  });

  if (initial.status !== 402) {
    return initial;
  }

  const paymentRequirements = (await initial.json()) as PaymentRequirements;
  const signResponse = await fetch(SIGN_PAYMENT_ENDPOINT, {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'Authorization': `Bearer ${oauthToken}`,
    },
    body: JSON.stringify({
      paymentRequirements,
      requestData: {
        url,
        method: 'POST',
      },
    }),
  });

  if (!signResponse.ok) {
    const errorText = await signResponse.text();
    throw new Error(`Payment signing failed: ${signResponse.status} ${errorText}`);
  }

  const signData = await signResponse.json();
  const paymentHeader = signData?.paymentHeader as string | undefined;
  if (!paymentHeader) {
    throw new Error('Payment signing failed: missing paymentHeader');
  }

  return fetch(url, {
    method: 'POST',
    headers: {
      ...baseHeaders,
      'X-Payment': paymentHeader,
    },
    body: JSON.stringify(payload),
  });
};

export const useMarketData = (
  settings: MarketSettings,
  selectedIndicators: string[],
  parameters: Record<string, Record<string, number>>,
  apiKey: string | null,
  oauthToken?: string | null
) => {
  const [candles, setCandles] = useState<CandleData[]>(DEFAULT_CANDLES);
  const [indicatorData, setIndicatorData] = useState<Record<string, Record<string, (number | null)[]>>>(() =>
    calculateIndicators(DEFAULT_CANDLES, selectedIndicators, parameters)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRateLimitedRef = useRef(false);
  const candlesRef = useRef<CandleData[]>([]);

  // Keep candlesRef in sync
  candlesRef.current = candles;

  const fetchData = useCallback(async (force = false) => {
    if (!apiKey && !oauthToken) {
      // No API key: keep showing defaults
      return;
    }

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
    setError(null);

    try {
      const exchange = exchangeMap[settings.exchange] || 'kraken';

      // Fetch candles
      const candlesPayload = {
        coin: settings.coin,
        exchange,
        interval: settings.timeframe,
        limit: settings.candleLimit,
      };

      console.log('Fetching candles via proxy:', candlesPayload);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['X-Agnic-Token'] = apiKey;
      } else if (oauthToken) {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }

      const endpoint = apiKey ? PROXY_ENDPOINT : DIRECT_CANDLES_ENDPOINT;
      const response = apiKey
        ? await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(candlesPayload),
          })
        : await callX402WithOAuth(endpoint, candlesPayload, oauthToken ?? '');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`status ${response.status} ${response.statusText}: ${errorText}`);
      }

      const candlesResponse = await response.json();
      isRateLimitedRef.current = false;

      // Transform candles response - accept multiple shapes
      const rawCandles = candlesResponse?.candles || candlesResponse?.data || candlesResponse || [];
      
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

      toast.success('Data loaded');
    } catch (error) {
      console.error('Error fetching market data:', error);
      const message = error instanceof Error ? error.message : 'Failed to load data';
      setError(message);
      toast.error(`API error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [settings, selectedIndicators, parameters, apiKey, oauthToken]);

  // Debounced effect for settings changes
  useEffect(() => {
    if (!apiKey && !oauthToken) {
      setIsLoading(false);
      return;
    }

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
  }, [fetchData, apiKey, oauthToken]);

  // Recompute indicators when candles/selection/parameters change (keeps defaults useful)
  useEffect(() => {
    if (candles.length && selectedIndicators.length) {
      const calculatedIndicators = calculateIndicators(candles, selectedIndicators, parameters);
      setIndicatorData(calculatedIndicators);
    } else {
      setIndicatorData({});
    }
  }, [candles, selectedIndicators, parameters]);

  return { candles, indicatorData, isLoading, error, refetch: () => fetchData(true) };
};
