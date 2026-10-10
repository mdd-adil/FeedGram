const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URL;

if (!mongoUri) {
  console.error("MongoDB Error: MONGO_URL environment variable is not defined!");
}

const mongoDb = mongoose.connect(mongoUri)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

module.exports = mongoDb;