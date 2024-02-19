const mongoose = require("mongoose");
require("dotenv").config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // serverSelectionTimeoutMS: 30000, 
      // socketTimeoutMS: 30000,
    });
    console.log("Connected to the MongoDB");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

module.exports = connect;
