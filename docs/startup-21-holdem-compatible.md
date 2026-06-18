# 21 Stackem Startup With 21 Holdem Backend

Stackem uses the same shared backend contract as 21 Holdem for auth, profile, wallet, shop, transactions, and daily rewards.

The matching 21 Holdem startup docs are in:

`D:\21HOLDEM25 LOCALV2\README.md`

## Start 21 Holdem Game Backend

```powershell
cd "D:\21HOLDEM25 LOCALV2\Bigslick_Game_Backend"
npm run dev
```

Stackem uses the same Holdem backend process on port `3050`, exposed on the machine LAN address:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.111:3050
EXPO_PUBLIC_SOCKET_BASE_URL=ws://192.168.0.111:3050
EXPO_PUBLIC_BIG_SLICK_GAMES_URL=https://bigslickgames.com
```

## Start Stackem Frontend

```powershell
cd "D:\BSG DEV\Projects\21Stackem\frontend"
npm run web -- --host lan --port 8081
```

## Important

Do not use machine-only loopback URLs for Stackem startup. Phones, tablets, and hosted pages cannot reach them.

Do not start Stackem against its own backend if you are testing shared Holdem rewards. Shared rewards are served by the Holdem Game backend on port `3050`.

Production should use a real HTTPS API origin, for example:

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.bigslickgames.com
EXPO_PUBLIC_SOCKET_BASE_URL=wss://api.bigslickgames.com
EXPO_PUBLIC_BIG_SLICK_GAMES_URL=https://bigslickgames.com
```
