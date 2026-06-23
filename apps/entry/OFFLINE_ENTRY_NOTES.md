# Big Slick Games Offline Entry

This folder is the offline entry-point candidate for the rebuilt Big Slick Games platform.

Source:

```text
https://github.com/BigSlickGames/BigSlickGames.git
commit c1aceb7 updated version
```

Copied from:

```text
D:\downloads\BigSlickGames-repo-check
```

Offline preview changes:

- `src/App.tsx` starts with a public visitor profile so the site opens directly to the dashboard.
- `src/App.tsx` upgrades to the BSG Mongo-backed profile only when an existing BSG session is available.
- `.env.local` contains placeholder local preview values only.

Live safety:

- This app is not deployed.
- No live server files, DNS, GitHub repos, or `D:\Website` files were changed.
- Treat this as the offline platform entry point until the BSG API/Mongo integration is deployed deliberately.
