# Stackem Backend

This folder is the Stackem-owned backend codebase.

## Intent

Use this backend for game-specific APIs and shared-db reads/writes without adding more Stackem logic to the older 21 Holdem backend repo.

## Current migration state

- Shared auth/profile/wallet/socket services still live in the common 21 Holdem backend on port `4000`.
- Stackem-specific APIs should be built here.
- The database stays shared. This backend reads the same local `holdem` Mongo database on `27017` and Redis on `6379`.

## Suggested module ownership

- `src/modules/stackem/`: runs, leaderboard, player stats, game-specific data
- `src/modules/auth/`: future Stackem auth adapter if you stop using the common backend
- `src/modules/profile/`: future Stackem profile projection layer
- `src/modules/shared/`: db, env, logging, errors

## Run

```powershell
copy .env.example .env
npm install
npm run dev
```

Default local port:

- `4010`

Default shared dependencies:

- MongoDB: `mongodb://127.0.0.1:27017/holdem`
- Redis: `redis://127.0.0.1:6379`
- Common backend API: `http://127.0.0.1:4000/api/v1`
