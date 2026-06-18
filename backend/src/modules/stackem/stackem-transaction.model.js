const mongoose = require('mongoose');

const StackemTransactionSchema = new mongoose.Schema(
  {
    iUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    iSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'stackem_sessions',
      index: true,
    },
    eType: {
      type: String,
      enum: ['entry', 'reward', 'weekly-prize'],
      required: true,
    },
    nAmount: { type: Number, required: true },
    eDirection: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    sDescription: { type: String, default: '' },
  },
  { collection: 'stackem_transactions', timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

module.exports =
  mongoose.models.stackem_transactions ||
  mongoose.model('stackem_transactions', StackemTransactionSchema);
