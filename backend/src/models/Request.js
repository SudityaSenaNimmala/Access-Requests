import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    // Note: 'collectionName' used instead of 'collection' to avoid Mongoose reserved keyword
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    developerName: {
      type: String,
      required: true,
    },
    developerEmail: {
      type: String,
      required: true,
    },
    dbInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DBInstance',
      required: true,
    },
    dbInstanceName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    collectionName: {
      type: String,
      default: 'unknown',
    },
    queryType: {
      type: String,
      default: 'custom',
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamLeadName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'executed', 'failed'],
      default: 'pending',
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    reviewComment: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    executedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
requestSchema.index({ developerId: 1, status: 1 });
requestSchema.index({ teamLeadId: 1, status: 1 });
requestSchema.index({ createdAt: -1 });

const Request = mongoose.model('Request', requestSchema);

export default Request;
