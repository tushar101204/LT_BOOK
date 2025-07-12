const mongoose = require("mongoose");
require("dotenv").config();

const DB = process.env.DATABASE;

mongoose.set('strictQuery', false); // Set to false to avoid warnings for strict mode in Mongoose 6

const connectDB = async () => {
  try {
    await mongoose.connect(DB, {
      useNewUrlParser: true,        // Use new URL parser to avoid deprecation warnings
      useUnifiedTopology: true,     // Use new server discovery and monitoring engine
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Connection error:", error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
