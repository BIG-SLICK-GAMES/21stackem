# Stackem Economy Manual Test Notes

Use a signed-in user with a known chip balance.

1. Easy first daily game: start Easy and verify no chips are deducted and the session reports `startingFilledTilesCount: 0`.
2. Medium first daily game: start Medium and verify no chips are deducted and the session reports `startingFilledTilesCount: 3`.
3. Hard first daily game: start Hard and verify no chips are deducted and the session reports `startingFilledTilesCount: 6`.
4. Fourth game on same difficulty: start the same difficulty 4 times in one UTC day and verify the fourth start deducts 50 chips.
5. Separate free games: use 3 Easy games and verify Medium and Hard still show 3 free games remaining.
6. Insufficient chips: after using free games, set chips below 50 and verify start is blocked with `You need 50 chips to play another Stackem game`.
7. Exact 21 payouts: complete sessions with Easy 2 cards, Medium 4 cards, and Hard 5 cards. Expected rounded payouts are 100, 338, and 625 chips.
8. Bust or miss: complete a session with a non-21 total and verify reward is 0.
9. Duplicate complete: repeat the same complete request and verify the second request is rejected and no second reward is paid.
10. Leaderboard: verify successful 21s update `totalStackemChipsWon`, `successful21Count`, `bestSingleWin`, and `gamesPlayed`.
11. Starting filled tiles: verify seeded tiles carry `seeded: true` in the frontend board and are not counted in the submitted `cardsUsed`.

Weekly leaderboard prizes are not automatically paid. `payWeeklyLeaderboardPrizes` is a future scheduled-payout stub.
