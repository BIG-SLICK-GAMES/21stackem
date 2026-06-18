# 21 Stackem Workspace

This repo is now split into three clear work areas:

- `frontend/`: the Expo/React Native game client
- `backend/`: Stackem-owned API files for game-specific services
- `database/`: Mongo/Redis/docker notes and shared database wiring

## Current status

- The live game client runs from `frontend/`.
- The live shared auth/profile/wallet/socket flow still points at the cleaned 21 Holdem backend on port `4000`.
- Stackem-specific backend ownership starts in `backend/`, so your backend developer can extend game APIs there without editing the 21 Holdem codebase.
- The shared database remains the Holdem Mongo/Redis stack: MongoDB `holdem` on `27017`, Redis on `6379`. We are separating code ownership, not creating a second database.

## Folder guide

### `frontend/`

Own this folder for:

- Expo routes and screens
- gameplay logic
- frontend Docker/web build
- frontend env and deploy docs

### `backend/`

Own this folder for:

- Stackem API routes
- Stackem models and services
- shared-database connection code
- future Stackem auth/profile adapters if you decide to stop using the common backend

### `database/`

Own this folder for:

- Mongo/Redis docker config
- connection strings
- DB topology notes
- backup/init/migration notes

## Working rules

Use this split going forward:

1. Frontend changes go in `frontend/`
2. Stackem backend changes go in `backend/`
3. Database and infra changes go in `database/`

Do not add new Stackem server logic back into the old 21 Holdem backend repo unless it is intentionally shared across all games.

## Run

Shared Holdem infrastructure:

```powershell
cd ..\Bigslickgames
docker compose up -d mongodb redis
npm --prefix game-backend start
```

Stackem backend:

```powershell
cd backend
npm install
npm run dev
```

Stackem frontend:

```powershell
cd frontend
npm install
npm run check
npm run web
```

Optional Stackem-local DB bootstrap:

```powershell
cd database
docker compose up -d
```

Only use the Stackem-local DB bootstrap if the shared Holdem docker stack is not already running. It uses the same `bigslick-mongodb`/`bigslick-redis` service names and the same local ports so Stackem does not drift onto a separate database.
