# API and Launch Contracts

## Hub Runtime Environment

The hub reads these public environment values:

```text
VITE_BSG_API_ENDPOINT=http://127.0.0.1:3001/api
VITE_STACKEM_APP_URL=http://127.0.0.1:8094/stackem
```

The local API reads:

```text
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=bsg_platform
BSG_API_PORT=3001
BSG_JWT_SECRET=change-this-before-production
```

Do not commit production secrets or Mongo connection strings.

## Platform Boundary

The BSG hub owns its own account, profile, wallet, shop, and rewards database.
The existing standalone card game remains outside this platform repo and does not share this database.

## Current Local API

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/profile
POST /api/profile/update
POST /api/profile/setting
GET  /api/shop
POST /api/shop/buy
GET  /api/daily_rewards
POST /api/daily_rewards/claim
```

The API also accepts `/api/v1/...` as a compatibility prefix for game clients.

## Game Launch Targets

Current hub catalog targets:

```text
21 Stack'em -> VITE_STACKEM_APP_URL
Future games -> hub information pages until configured
```

The hub opens games as first-class pages/apps, not iframes.

## Auth Contract Direction

- Hub login/register creates BSG platform accounts in MongoDB.
- Games receive a BSG token from the hub where needed.
- Long term, games should exchange short-lived handoff codes instead of receiving long-lived tokens in URLs.

## Deployment Rule

No live server change is part of this local contract. Readiness comes from:

- project config
- repo status
- dry-run report
- backup record
- server preflight
- explicit approval
- rollback notes
