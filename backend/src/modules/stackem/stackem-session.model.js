const mongoose = require('mongoose');

const StackemSessionSchema = new mongoose.Schema(
  {
    iUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      index: true,
      required: true,
    },
    sUserName: { type: String, default: 'Player' },
    eDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    bFreeAttempt: { type: Boolean, default: true },
    nEntryCostCharged: { type: Number, default: 0 },
    nStartingFilledTilesCount: { type: Number, default: 0 },
    aStartingFilledTiles: {
      type: [
        {
          _id: false,
          col: Number,
          row: Number,
        },
      ],
      default: [],
    },
    eStatus: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
      index: true,
    },
    bRewardPaid: { type: Boolean, default: false },
    nFinalTotal: { type: Number, default: null },
    nCardsUsed: { type: Number, default: null },
    nMultiplier: { type: Number, default: null },
    nRewardAmount: { type: Number, default: 0 },
    dCompletedDate: { type: Date, default: null },
  },
  { collection: 'stackem_sessions', timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

StackemSessionSchema.index({ iUserId: 1, eStatus: 1, dCreatedDate: -1 });

module.exports =
  mongoose.models.stackem_sessions || mongoose.model('stackem_sessions', StackemSessionSchema);
