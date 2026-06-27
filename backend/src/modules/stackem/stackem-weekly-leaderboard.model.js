const mongoose = require('mongoose');

const StackemWeeklyLeaderboardSchema = new mongoose.Schema(
  {
    iUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    sUserName: { type: String, default: 'Player' },
    eDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    nTotalStackemChipsWon: { type: Number, default: 0, index: true },
    nSuccessful21Count: { type: Number, default: 0, index: true },
    nBestSingleWin: { type: Number, default: 0, index: true },
    nGamesPlayed: { type: Number, default: 0 },
    dWeekStartDate: { type: Date, required: true },
    dWeekEndDate: { type: Date, required: true },
  },
  {
    collection: 'stackem_weekly_leaderboards',
    timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' },
  }
);

StackemWeeklyLeaderboardSchema.index(
  { iUserId: 1, eDifficulty: 1, dWeekStartDate: 1 },
  { unique: true }
);
StackemWeeklyLeaderboardSchema.index({
  dWeekStartDate: -1,
  nTotalStackemChipsWon: -1,
  nSuccessful21Count: -1,
  nBestSingleWin: -1,
});

module.exports =
  mongoose.models.stackem_weekly_leaderboards ||
  mongoose.model('stackem_weekly_leaderboards', StackemWeeklyLeaderboardSchema);
