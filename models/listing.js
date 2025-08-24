const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: {
      filename: String,
      url: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
      },
    },
    price: { type: Number, required: true, min: 0 },
    location: String,
    country: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
