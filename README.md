# Agentic Crypto Indicators

An advanced crypto market analysis workspace that combines live candle data, technical indicator computation, scenario-driven learning, wallet-gated data access, and an AI advisor that reasons over the active chart context.

The project is built as an interactive analyst console rather than a static dashboard. Users can select markets, tune indicator parameters, inspect live readings, apply predefined trading-analysis scenarios, and ask an AI model to explain what the selected indicators imply in the current market context.

> Educational tool only. This application does not provide investment advice or trading signals.

## What It Does

- Visualizes crypto OHLCV candles with selected technical overlays.
- Computes technical indicators client-side from candle data for fast iteration.
- Supports indicator presets for momentum, trend, and volatility analysis.
- Provides scenario cards that load structured market-analysis workflows.
- Detects contextual event pins and pattern hints from price and indicator behavior.
- Integrates AgnicPay OAuth/API-token access for authenticated market data and paid x402-style API flows.
- Includes an AI advisor that receives structured market context and responds with grounded, explainable analysis.

## Agentic Layer

The strongest part of this project is the agentic workflow around the chart.

The AI advisor is not a generic chatbot bolted onto the UI. It receives a compact structured context built from the user's active workspace:

- selected indicators
- current indicator parameters
- latest valid indicator values
- latest candle state
- selected coin, exchange, and timeframe
- user prompt

That context is injected into the model request as system-level grounding, forcing responses to refer to the active market and timeframe. The assistant is also instructed to avoid financial advice, ask clarifying questions when data is missing, and explain indicator behavior clearly.

This creates an analyst-in-the-loop experience:

1. The user configures the market and indicators.
2. The app fetches or falls back to candle data.
3. Indicators are recalculated locally as parameters change.
4. Pattern hints and event pins provide deterministic context.
5. The AI advisor reasons over the current state and explains what matters.

The result is a hybrid system: deterministic technical-analysis logic handles the data plane, while the AI layer handles interpretation, explanation, and user-specific follow-up questions.

## Market Data and Payments

The app supports two access paths:

- API-key access through the Supabase `trading-proxy` function.
- OAuth wallet access through AgnicPay, including payment signing when an upstream endpoint returns an HTTP `402 Payment Required` response.

When using OAuth, the app can request candle data directly from the Agnic Hub trading-indicators endpoint. If the endpoint requires payment, the client asks AgnicPay to sign the payment requirements and retries the request with an `X-Payment` header.

The wallet widget includes:

- OAuth PKCE login flow
- access-token storage in `sessionStorage`
- wallet balance retrieval
- reusable auth context
- optional payment and webhook hooks

## Indicators

The project currently models a broad technical-analysis surface:

- RSI
- MACD
- Stochastic Oscillator
- Stoch RSI
- OBV
- SMA
- EMA
- ADX
- Bollinger Bands
- Support / Resistance
- ATR

Client-side calculations currently cover the implemented chart overlays and readings, including SMA, EMA, Bollinger Bands, RSI, and ATR. The indicator configuration layer is broader than the local calculation engine, which makes the app ready for deeper API-backed expansion.

## Scenario Workflows

Scenario cards turn the dashboard into a guided analysis environment. Each scenario applies a market setup, timeframe, candle depth, and relevant indicator set.

Included workflows:

- **Trend Reversal Anatomy**: EMA and RSI context for momentum shifts.
- **Range Compression**: Bollinger Bands and ATR for volatility contraction.
- **Momentum Checkup**: RSI, SMA, and EMA for short-term vs long-term balance.

These scenarios are useful for onboarding, education, demos, and repeatable research workflows.

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- Recharts
- React Query
- Supabase client
- AgnicPay wallet/OAuth integration
- Agnic AI chat completions API

## Project Structure

```text
src/
  components/          UI panels, chart, advisor, selectors, readings
  hooks/               market-data loading and app hooks
  integrations/        Supabase client and generated types
  types/               indicator, market, and scenario models
  utils/               indicator math, event pins, pattern hints
  wallet-widget/       reusable AgnicPay auth and wallet components
```

## Getting Started

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Run linting:

```sh
npm run lint
```

## Configuration

The app can run with default candles for local exploration. Live data and AI features require authentication through either AgnicPay OAuth or an API token.

Useful environment variables:

```sh
VITE_AGNIC_AI_MERCHANT_ID=
VITE_AGNIC_AI_PAYOUT_WALLET=
VITE_AGNIC_AI_FEE_PERCENT=
VITE_AGNICPAY_PAYMENT_URL=
VITE_AGNICPAY_WEBHOOK_URL=
```

The OAuth client configuration lives in:

```text
src/wallet-widget/authService.ts
```

For another deployment, update the OAuth `clientId`, scopes, and redirect URI to match the registered application.

## AI Advisor Models

The advisor panel supports multiple hosted model options through Agnic AI:

- Google Gemini 3 Flash Preview
- OpenAI GPT-5.2 Chat
- Amazon Nova 2 Lite
- Anthropic Claude Sonnet 4.5

The model receives a structured indicator snapshot instead of raw UI state. This keeps requests compact and makes responses easier to ground in the active chart.

## Security Notes

- Do not commit live API tokens or wallet secrets.
- Prefer OAuth for user-facing flows.
- Keep payment signing behind trusted AgnicPay flows.
- Use backend proxies for privileged operations where possible.
- Treat AI output as explanatory analysis, not as execution authority.

## Roadmap Ideas

- Expand local calculations for MACD, ADX, OBV, Stochastic, Stoch RSI, and support/resistance.
- Add streaming AI responses.
- Persist user workspaces and saved indicator presets.
- Add backtesting views for scenario validation.
- Add richer x402 payment telemetry and cost visibility.
- Promote scenario cards into reusable research playbooks.
