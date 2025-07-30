require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('WARNING: MONGO_URI not defined - MaxEvo will run in standalone mode');
  // Don't throw error, allow graceful fallback
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDb() {
  // Return null if no MONGO_URI - allow graceful fallback
  if (!MONGO_URI) {
    console.warn('MongoDB connection skipped - no MONGO_URI provided');
    return null;
  }

  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false,
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // bufferMaxEntries: 0,
      // useFindAndModify: true,
      // useCreateIndex: true
    };

    mongoose.set('strictQuery', true);
    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;

  return cached.conn;
}

module.exports = {
  connectDb,
};
