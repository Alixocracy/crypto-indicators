# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)




======




curl -X POST "https://api.agnicpay.xyz/api/x402/fetch?url=https://api.agnichub.xyz/v1/custom/trading-indicators/indicators&method=POST" \
  -H "X-Agnic-Token: agnic_tok_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkaWQ6cHJpdnk6Y21qbGxsMXFsMDRiMmp3MGNvZTh2ZHQxMyIsIm1heFBlclRyYW5zYWN0aW9uIjowLjIsImRhaWx5TGltaXQiOjMsIm1vbnRobHlMaW1pdCI6MTAsIm5ldHdvcmtzIjpbImJhc2UiLCJzb2xhbmEiXSwidHlwZSI6Im44bl9hdXRvbWF0aW9uIiwiY3JlYXRlZEF0IjoxNzY2NzA2MDAxMDMzLCJ0b2tlbklkIjoidG9rZW5fMTc2NjcwNjAwMTAzM18yZjA3MmIyZCIsImlhdCI6MTc2NjcwNjAwMSwiZXhwIjoxNzk4MjQyMDAxfQ.azOkloqbeVNFUoKAdiHi6SCZBl4Mgf3hDaa2PS045co" \
  -H "Content-Type: application/json" \
  -d '{
    "coin": "BTC",
    "exchange": "kraken",
    "interval": "1h",
    "limit": 300,
    "indicators": [
      { "name": "RSI", "period": 14 },
      { "name": "MACD", "fast": 12, "slow": 26, "signal": 9 },
      { "name": "SMA", "period": 50 },
      { "name": "EMA", "period": 21 },
      { "name": "BBANDS", "period": 20, "stddev": 2 },
      { "name": "ADX", "period": 14 },
      { "name": "ATR", "period": 14 },
      { "name": "OBV" },
      { "name": "STOCH", "kPeriod": 14, "dPeriod": 3, "smoothing": 3 },
      { "name": "STOCHRSI", "period": 14 },
      { "name": "SUPPORT_RESISTANCE", "lookback": 20 }
    ]
  }'





curl -X POST "https://api.agnicpay.xyz/api/x402/fetch?url=https://api.agnichub.xyz/v1/custom/trading-indicators/candles&method=POST" \
  -H "X-Agnic-Token: agnic_tok_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkaWQ6cHJpdnk6Y21qbGxsMXFsMDRiMmp3MGNvZTh2ZHQxMyIsIm1heFBlclRyYW5zYWN0aW9uIjowLjIsImRhaWx5TGltaXQiOjMsIm1vbnRobHlMaW1pdCI6MTAsIm5ldHdvcmtzIjpbImJhc2UiLCJzb2xhbmEiXSwidHlwZSI6Im44bl9hdXRvbWF0aW9uIiwiY3JlYXRlZEF0IjoxNzY2NzA2MDAxMDMzLCJ0b2tlbklkIjoidG9rZW5fMTc2NjcwNjAwMTAzM18yZjA3MmIyZCIsImlhdCI6MTc2NjcwNjAwMSwiZXhwIjoxNzk4MjQyMDAxfQ.azOkloqbeVNFUoKAdiHi6SCZBl4Mgf3hDaa2PS045co" \
  -H "Content-Type: application/json" \
  -d '{
    "coin": "BTC",
    "exchange": "kraken",
    "interval": "1h",
    "limit": 5
  }'




curl -X POST   https://indicator-api.fly.dev/trading/v1/indicators \
  -H "Content-Type: application/json" \
  -d '{
    "coin": "BTC",
    "exchange": "kraken",
    "interval": "1h",
    "limit": 300,
    "indicators": [
      { "name": "RSI", "period": 14 },
      { "name": "MACD", "fast": 12, "slow": 26, "signal": 9 },
      { "name": "SMA", "period": 50 },
      { "name": "EMA", "period": 21 },
      { "name": "BBANDS", "period": 20, "stddev": 2 },
      { "name": "ADX", "period": 14 },
      { "name": "ATR", "period": 14 },
      { "name": "OBV" },
      { "name": "STOCH", "kPeriod": 14, "dPeriod": 3, "smoothing": 3 },
      { "name": "STOCHRSI", "period": 14 },
      { "name": "SUPPORT_RESISTANCE", "lookback": 20 }
    ]
  }'
```