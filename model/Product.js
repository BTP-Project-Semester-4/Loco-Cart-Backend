const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    Name: {
      type: String,
      min: 1,
      max: 50,
      trim: true,
      required: true,
    },
    Normal_Price: {
      type: Number,
      required: true,
    },
    Bidding_Price: {
      type: Number,
    },
    Category: {
      type: String,
      min: 1,
      max: 50,
      trim: true,
      required: true,
    },
    Quaantity: {
      type: Number,
      require: true,
    },
    Image: {
      type: String,
    },
    Seller_ID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
