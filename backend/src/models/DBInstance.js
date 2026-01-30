import mongoose from 'mongoose';
import { encrypt, decrypt } from '../config/encryption.js';

const dbInstanceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    connectionString: {
      type: String,
      required: true,
    },
    database: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt connection string before saving
dbInstanceSchema.pre('save', function (next) {
  if (this.isModified('connectionString')) {
    // Only encrypt if not already encrypted (check for typical MongoDB URI format)
    if (this.connectionString.startsWith('mongodb')) {
      this.connectionString = encrypt(this.connectionString);
    }
  }
  next();
});

// Method to get decrypted connection string
dbInstanceSchema.methods.getConnectionString = function () {
  return decrypt(this.connectionString);
};

// Virtual to hide connection string in JSON responses
dbInstanceSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.connectionString;
    return ret;
  },
});

const DBInstance = mongoose.model('DBInstance', dbInstanceSchema);

export default DBInstance;
