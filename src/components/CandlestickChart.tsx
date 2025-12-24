import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { CandleData, INDICATOR_CONFIGS } from '@/types/indicators';

interface CandlestickChartProps {
  candles: CandleData[];
  selectedIndicators: string[];
  indicatorData: Record<string, Record<string, number[]>>;
}

const indicatorColors: Record<string, string> = {
  rsi: '#F97316',
  macd: '#3B82F6',
  macd_signal: '#60A5FA',
  macd_histogram: '#93C5FD',
  stoch: '#F97316',
  stoch_d: '#FDBA74',
  stochrsi: '#F97316',
  obv: '#F97316',
  sma: '#3B82F6',
  ema: '#60A5FA',
  adx: '#3B82F6',
  bbands_upper: '#A855F7',
  bbands_middle: '#C084FC',
  bbands_lower: '#A855F7',
  atr: '#A855F7',
};

const CandlestickChart = ({ candles, selectedIndicators, indicatorData }: CandlestickChartProps) => {
  const chartData = useMemo(() => {
    return candles.map((candle, index) => {
      const dataPoint: any = {
        time: new Date(candle.timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        // For candlestick visualization
        candleBody: [Math.min(candle.open, candle.close), Math.max(candle.open, candle.close)],
        candleWick: [candle.low, candle.high],
        isUp: candle.close >= candle.open,
      };

      // Add indicator values
      Object.entries(indicatorData).forEach(([indicatorId, values]) => {
        Object.entries(values).forEach(([key, arr]) => {
          if (arr[index] !== undefined) {
            dataPoint[`${indicatorId}_${key}`] = arr[index];
          }
        });
      });

      return dataPoint;
    });
  }, [candles, indicatorData]);

  const priceExtent = useMemo(() => {
    if (candles.length === 0) return { min: 0, max: 100 };
    const prices = candles.flatMap(c => [c.high, c.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return { min: min - padding, max: max + padding };
  }, [candles]);

  // Determine which indicators overlay on price vs separate panels
  const overlayIndicators = selectedIndicators.filter(id => 
    ['sma', 'ema', 'bbands'].includes(id)
  );

  const formatPrice = (value: unknown): string => {
    // Handle arrays (from candleBody [min, max])
    if (Array.isArray(value)) {
      return value.map(v => formatPrice(v)).join(' - ');
    }
    // Handle non-numbers
    if (typeof value !== 'number' || isNaN(value)) {
      return String(value);
    }
    if (value >= 10000) return `$${(value / 1000).toFixed(1)}k`;
    if (value >= 1000) return `$${value.toFixed(0)}`;
    return `$${value.toFixed(2)}`;
  };

  if (candles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Loading chart data...</p>
          <p className="text-sm">Select your market settings to begin exploring</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-4">
      {/* Main Price Chart */}
      <div className="h-[60%] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bbandsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#6B7280', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[priceExtent.min, priceExtent.max]}
              tick={{ fill: '#6B7280', fontSize: 10 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              tickFormatter={formatPrice}
              orientation="right"
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(222 47% 9%)', 
                border: '1px solid hsl(222 30% 18%)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: number) => formatPrice(value)}
            />

            {/* Bollinger Bands Fill */}
            {overlayIndicators.includes('bbands') && indicatorData.bbands && (
              <Area
                dataKey="bbands_upper"
                stroke="transparent"
                fill="url(#bbandsFill)"
                type="monotone"
              />
            )}

            {/* Candlesticks as bars */}
            {chartData.map((entry, index) => (
              <ReferenceLine
                key={`wick-${index}`}
                segment={[
                  { x: entry.time, y: entry.low },
                  { x: entry.time, y: entry.high }
                ]}
                stroke={entry.isUp ? '#22C55E' : '#EF4444'}
                strokeWidth={1}
              />
            ))}

            <Bar
              dataKey="candleBody"
              fill="#22C55E"
              stroke="none"
              barSize={6}
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.isUp ? '#22C55E' : '#EF4444';
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={Math.max(height, 1)}
                    fill={fill}
                    rx={1}
                  />
                );
              }}
            />

            {/* Overlay Indicators */}
            {overlayIndicators.includes('sma') && indicatorData.sma && (
              <Line
                type="monotone"
                dataKey="sma_value"
                stroke={indicatorColors.sma}
                dot={false}
                strokeWidth={2}
              />
            )}
            {overlayIndicators.includes('ema') && indicatorData.ema && (
              <Line
                type="monotone"
                dataKey="ema_value"
                stroke={indicatorColors.ema}
                dot={false}
                strokeWidth={2}
              />
            )}
            {overlayIndicators.includes('bbands') && indicatorData.bbands && (
              <>
                <Line
                  type="monotone"
                  dataKey="bbands_upper"
                  stroke={indicatorColors.bbands_upper}
                  dot={false}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="bbands_middle"
                  stroke={indicatorColors.bbands_middle}
                  dot={false}
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="bbands_lower"
                  stroke={indicatorColors.bbands_lower}
                  dot={false}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chart-up"></div>
          <span className="text-muted-foreground">Bullish Candle</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-chart-down"></div>
          <span className="text-muted-foreground">Bearish Candle</span>
        </div>
        {overlayIndicators.map(id => {
          const config = INDICATOR_CONFIGS.find(c => c.id === id);
          if (!config) return null;
          return (
            <div key={id} className="flex items-center gap-2">
              <div 
                className="w-6 h-0.5 rounded" 
                style={{ backgroundColor: indicatorColors[id] || indicatorColors[`${id}_middle`] }}
              ></div>
              <span className="text-muted-foreground">{config.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CandlestickChart;
