import { useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CandleData } from '@/types/indicators';
import { useAuth } from '@/wallet-widget/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type IndicatorDataMap = Record<string, Record<string, (number | null)[]>>;

interface AiAdvisorPanelProps {
  selectedIndicators: string[];
  indicatorData: IndicatorDataMap;
  parameters: Record<string, Record<string, number>>;
  candles: CandleData[];
  marketContext?: {
    coin: string;
    exchange: string;
    timeframe: string;
  };
  apiKey?: string | null;
  merchantId?: string;
  payoutWallet?: string;
  feePercent?: number;
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
};

const MODEL_OPTIONS = [
  { id: 'google/gemini-3-flash-preview', label: 'Google: Gemini 3 Flash Preview' },
  { id: 'openai/gpt-5.2-chat', label: 'OpenAI: GPT-5.2 Chat' },
  { id: 'amazon/nova-2-lite-v1', label: 'Amazon: Nova 2 Lite' },
  { id: 'anthropic/claude-sonnet-4.5', label: 'Anthropic: Claude Sonnet 4.5' },
];

const getLastValid = (series?: (number | null)[]) => {
  if (!series) return null;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    if (series[i] != null) return series[i] as number;
  }
  return null;
};

const buildIndicatorContext = (
  selectedIndicators: string[],
  indicatorData: IndicatorDataMap,
  parameters: Record<string, Record<string, number>>,
  candles: CandleData[]
) => {
  const lastCandle = candles[candles.length - 1] ?? null;
  const indicators: Record<string, Record<string, number | null>> = {};

  selectedIndicators.forEach((id) => {
    const seriesMap = indicatorData[id];
    if (!seriesMap) return;
    const latestValues: Record<string, number | null> = {};
    Object.entries(seriesMap).forEach(([key, series]) => {
      latestValues[key] = getLastValid(series);
    });
    indicators[id] = latestValues;
  });

  return {
    selectedIndicators,
    parameters: selectedIndicators.reduce<Record<string, Record<string, number>>>((acc, id) => {
      if (parameters[id]) acc[id] = parameters[id];
      return acc;
    }, {}),
    lastCandle,
    indicators,
  };
};

const AiAdvisorPanel = ({
  selectedIndicators,
  indicatorData,
  parameters,
  candles,
  marketContext,
  apiKey,
  merchantId,
  payoutWallet,
  feePercent,
}: AiAdvisorPanelProps) => {
  const { getToken } = useAuth();
  const oauthToken = getToken();
  const authToken = oauthToken || apiKey || null;
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0]?.id ?? 'openai/gpt-5.2-chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const config = useMemo(() => {
    const env = import.meta.env;
    return {
      merchantId: merchantId ?? env.VITE_AGNIC_AI_MERCHANT_ID ?? 'did:privy:cmivb2a8t06qgl70b7d50o8xl',
      payoutWallet: payoutWallet ?? env.VITE_AGNIC_AI_PAYOUT_WALLET ?? '0x0A374a7d3D057c6F2910BEaa177f808984C18124',
      feePercent: feePercent ?? Number(env.VITE_AGNIC_AI_FEE_PERCENT ?? 35),
    };
  }, [merchantId, payoutWallet, feePercent]);

  const indicatorContext = useMemo(
    () => buildIndicatorContext(selectedIndicators, indicatorData, parameters, candles),
    [selectedIndicators, indicatorData, parameters, candles]
  );

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (!authToken) {
      setError('Login or API key required to use AI advisor.');
      return;
    }

    setError(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [userMessage, ...prev]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt =
        'You are a market indicators advisor. Use the provided indicator context and explain clearly. ' +
        'Do not give financial advice. If data is missing, ask clarifying questions. ' +
        'Every response must explicitly mention the crypto, exchange, and timeframe from the market context.';
      const contextPrompt = `Indicator context: ${JSON.stringify(indicatorContext)}`;
      const marketPrompt = marketContext
        ? `Market context: ${marketContext.coin} on ${marketContext.exchange}, timeframe ${marketContext.timeframe}.`
        : 'Market context: unknown.';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Merchant-Id': config.merchantId,
        'X-Merchant-Wallet': config.payoutWallet,
        'X-Merchant-Fee-Percent': String(config.feePercent),
      };
      if (oauthToken) {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      } else if (apiKey) {
        headers['X-Agnic-Token'] = apiKey;
      }

      const response = await fetch('https://api.agnic.ai/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: marketPrompt },
            { role: 'system', content: contextPrompt },
            { role: 'user', content: trimmed },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const assistantContent =
        data?.choices?.[0]?.message?.content ?? 'No response content received.';

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        createdAt: Date.now(),
      };
      setMessages((prev) => [assistantMessage, ...prev]);
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get AI response.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 1500);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  };

  return (
    <Card className="border-muted/60 bg-background">
      <CardHeader className="space-y-2">
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about the selected indicators..."
            rows={2}
            className="min-h-[56px]"
          />
          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? 'Thinking...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={listRef}
          className="max-h-[520px] space-y-3 overflow-y-auto rounded-md border border-muted/50 bg-muted/10 p-3"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ask a question to get indicator insights. Latest messages appear at the top.
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-md border border-muted/60 bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase text-muted-foreground">{message.role}</p>
                  {message.role === 'assistant' ? (
                    <button
                      type="button"
                      onClick={() => handleCopy(message)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      aria-label="Copy response"
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}
                </div>
                <div className="prose prose-sm max-w-none text-foreground prose-p:leading-relaxed prose-pre:bg-muted/40 prose-pre:border prose-pre:border-muted/60 prose-pre:rounded-md prose-code:text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
        </div>
        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
};

export default AiAdvisorPanel;
