# Product Specification — Indicator Playground

## Overview
- A no-login, browser-based playground that helps users learn how crypto market indicators behave in real time. Users can fetch live candles, overlay a handful of indicators, tweak parameters, and read plain-language explanations of what those indicators mean.

## Goals
- Make indicator concepts feel approachable for beginners while remaining useful for intermediate traders who want to experiment.
- Provide fast, low-friction exploration: minimal inputs, instant visual feedback, and clear explanations.
- Avoid implying trading advice; keep the tone educational and guard against misinterpretation.

## Target Users & Use Cases
- Curious learners who want to see what RSI, moving averages, and volatility tools look like on actual charts.
- Intermediate retail traders validating indicator behaviors across coins/timeframes.
- Content creators/instructors needing a lightweight demo tool during lessons.

## Experience & Flows
- Landing/header: branded “Indicator Playground” header with “No login needed” badge and educational welcome banner.
- Market setup: inline controls for coin (BTC/ETH/etc.), exchange (Kraken, Coinbase, etc.), timeframe (1m–1w), and candle count (50–500). Changes debounce for 500 ms; manual refresh button available.
- Indicator selection: grouped by Momentum, Trend, Volatility; each tile shows description and common mistakes via tooltip. Selection count displayed; presets set common combinations (Momentum/Trend/Volatility).
- Chart area: Recharts-based candlestick view with bullish/bearish coloring, optional overlays for SMA/EMA/Bollinger Bands, and legend. Height ~450px with responsive container.
- Parameters: collapsible “Parameters” panel shows sliders for selected indicators that expose tunable inputs (periods, std dev, etc.) with helper tooltips and min/default/max cues.
- Insights: right sidebar renders narrative takeaways per indicator (RSI, MACD, MA, Bollinger Bands, ADX, ATR) including sentiment badges and warnings. Empty/loading states handle no selection or delayed data.
- Guardrails: footer disclaimer (“educational only”), warnings inside tooltips/insights, and toasts for loading success/errors/rate limits.

## Functional Requirements
- Market data
  - Fetch OHLCV candles via Supabase Edge Function `trading-proxy` pointing to `indicator-api.fly.dev/trading/v1/candles`.
  - Respect min 2s spacing between API calls; debounce settings by 500 ms; manual refetch bypasses debounce.
  - Normalize timestamps to ms, sort ascending, and accept limits up to 500 candles.
- Indicators & parameters
  - Indicator catalog sourced from `INDICATOR_CONFIGS` with metadata (category, description, common mistakes, parameters).
  - Presets set predefined indicator combinations (momentum: RSI/MACD/OBV, trend: SMA/EMA/ADX, volatility: Bollinger/ATR).
  - Client-side calculations currently implemented for SMA, EMA, Bollinger Bands, RSI, and ATR only; others (MACD, Stoch, OBV, ADX, Support/Resistance) are defined but not yet computed or visualized.
  - Parameter changes immediately recompute client-side indicators.
- Charting
  - Render candlestick bars with wicks; overlay SMA/EMA/Bollinger Bands when selected.
  - Price axis on the right with formatted labels; tooltips show timestamp and values.
  - Legend differentiates bullish/bearish candles and overlay lines.
- Insights
  - Generate per-indicator messages using latest values where data exists; include sentiment (bullish/bearish/neutral) and cautionary notes.
  - Hide insights when indicator data is unavailable or no indicators are selected.
- Feedback & states
  - Toasts for load success, errors, and rate-limit fallbacks; show loader in chart region during fetches.
  - Empty-state messaging for chart and insights panels.

## Data & Integrations
- Backend: Supabase Edge Function `supabase/functions/trading-proxy/index.ts` proxies POSTs to `indicator-api.fly.dev` for `candles` (and supports `indicators`, unused today). CORS is open.
- Frontend data flow: `useMarketData` composes payload `{ coin, exchange, interval, limit }`, calls edge function, hydrates candles, and runs `calculateIndicators` for selected IDs.
- Environment: defaults baked in (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`) to allow the app to run without user-provided keys; can be overridden via Vite env vars.
- Rate limiting: skips fetches when under 2s threshold; on API rate-limit errors, retains cached candles and notifies users.

## Non-Functional Requirements
- Performance: initial data load and recompute should finish within a couple of seconds on broadband; interactions feel responsive on modern laptops and mobile.
- Reliability: graceful degradation when API is unavailable (use cached data when present, surface errors via toast).
- UX: responsive layout across desktop/tablet/mobile; tooltips and labels clarify jargon; no authentication required.
- Accessibility: maintain readable font sizes, color contrast on primary/secondary surfaces, and keyboard-focusable controls (inherits shadcn/Radix behavior).
- Security/Privacy: no user accounts or PII; outbound calls only to the proxy endpoint with public key.

## Constraints & Assumptions
- The app is educational; it must avoid presenting signals as financial advice.
- Only the implemented client-side indicators produce plots/insights; others require future API or local computation work.
- Data quality and availability depend on the upstream `indicator-api.fly.dev` service and exchange mappings defined in `useMarketData`.
- No persistence of user preferences across sessions.

## Open Questions / Backlog
- Should we compute or fetch missing indicators (MACD, Stoch/RSI, OBV, ADX, Support/Resistance) and plot them in dedicated panels?
- Do we need multi-timeframe comparisons, custom coin inputs, or per-user saved presets?
- Should we add onboarding hints/tooltips for first-time visitors?
- Do we need analytics (e.g., which indicators/presets are used) given the no-login stance?
- Should we expose export/share of snapshots (image/CSV) for educators?
