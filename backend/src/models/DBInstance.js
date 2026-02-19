import mongoose from 'mongoose';

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

// Method to get connection string (no encryption)
dbInstanceSchema.methods.getConnectionString = function () {
  return this.connectionString;
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
