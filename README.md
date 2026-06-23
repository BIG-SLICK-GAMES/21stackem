# BSG Platform

Clean platform workspace for Big Slick Games.

This workspace is for the future shared ecosystem:

- `bigslickgames.com` hub
- BSG-owned auth
- BSG-owned profile
- BSG-owned wallet
- BSG-owned shop
- BSG-owned rewards
- game launcher
- game-to-game handoff
- admin/ops surfaces

Production source remains in `D:\BSG DEV` until a specific migration step is reviewed and approved.

Do not deploy live from this workspace until deployment docs, dry-run checks, and rollback plans exist.

Do not use localhost probing or ad-hoc deploy commands as proof for platform readiness. Use the deployment extension/config data, dry-run reports, server preflight, and documented safety gates.

## Structure

```text
apps/
  hub/
  admin/
  games/
    21-stackem/
services/
  api/
  realtime/
  workers/
packages/
  ui/
  config/
  types/
  game-sdk/
  auth-client/
infrastructure/
  apache/
  pm2/
  env-templates/
  deployment/
docs/
```

## Source Material

- Hub source material: `D:\Website`
- Existing standalone card game source remains separate from this platform repo.
- Stackem frontend source: `D:\BSG DEV\Projects\21Stackem`
- Admin source: `D:\BSG DEV\Projects\BSGAdmin`
- Deployment controls: `D:\BSG DEPLOYMENT`

## First Rule

Migrate deliberately. Do not copy generated folders, caches, secrets, `node_modules`, build outputs, or old archived project paths.
