const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

(async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("✅ connected to DB");

    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("✅ data was initialized");
  } catch (err) {
    console.error("❌ Seed Error:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();
