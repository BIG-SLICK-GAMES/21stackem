const mongoose = require('mongoose');

const StackemDailyUsageSchema = new mongoose.Schema(
  {
    iUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    sDateKey: { type: String, required: true },
    nEasyUsed: { type: Number, default: 0 },
    nMediumUsed: { type: Number, default: 0 },
    nHardUsed: { type: Number, default: 0 },
  },
  { collection: 'stackem_daily_usage', timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

StackemDailyUsageSchema.index({ iUserId: 1, sDateKey: 1 }, { unique: true });

module.exports =
  mongoose.models.stackem_daily_usage ||
  mongoose.model('stackem_daily_usage', StackemDailyUsageSchema);
