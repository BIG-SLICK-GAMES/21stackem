# 21 Stackem Offline Game

This folder is the offline copy of the newer Stackem frontend.

Source:

```text
D:\BSG DEV\Projects\21Stackem\frontend
```

Live safety:

- This copy is for local/offline platform integration only.
- The source DEV project was not modified.
- No live server, GitHub repo, DNS, or production files were touched.

Integration target:

```text
D:\BSG PLATFORM\apps\entry
```

The entry app should launch this local game instead of the older embedded `src/games/stack-em` implementation.

Local preview:

```text
http://127.0.0.1:8094/stackem
```

Current entry integration:

```text
D:\BSG PLATFORM\apps\entry\src\components\Dashboard.tsx
```

The `stack-em` click handler opens the local Stackem preview URL above.
