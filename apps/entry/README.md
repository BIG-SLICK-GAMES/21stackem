# Big Slick Games Hub

Offline hub entry app for Big Slick Games.

## Data Source

The hub opens directly into the portal. Login, profile, shop, rewards, and game navigation use the BSG platform API backed by the `bsg_platform` MongoDB database.

- Profile: `GET /api/v1/profile`
- Shop: `GET /api/v1/shop`, `POST /api/v1/shop/buy`
- Rewards: `GET /api/v1/daily_rewards`, `POST /api/v1/daily_rewards/claim`

This keeps the hub independent from the existing standalone card game, which remains its own entity and database.

## Local Config

Set the BSG API and MongoDB connection in `.env.local`:

```env
VITE_BSG_API_ENDPOINT=http://127.0.0.1:3001/api
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=bsg_platform
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

## Commands

```bash
npm install
npm run build
npm run api
npm run preview -- --host 127.0.0.1 --port 8093
```
