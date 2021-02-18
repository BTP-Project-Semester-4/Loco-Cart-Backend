const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  Name: {
    type: String,
    min: 1,
    max: 50,
    trim: true,
    required: true,
  },
  Category: {
    type: String,
    min: 1,
    max: 50,
    trim: true,
    required: true,
  },
  Sellers: {
    type: Map,
    of: {
      SellerPrice: {
        type: Number,
        required: true,
      },
      Description: {
        type: String,
        required: true,
      },
      BiddingPrice: {
        type: Number,
      },
      SellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
      },
      Quantity: {
        type: Number,
        required: true,
      },
      Image: {
        type: String,
        required: true,
      },
      Rating: {
        type: mongoose.Decimal128,
        default: 0,
      },
      Comments: [
        {
          Name: {
            type: String,
          },
          Rating: {
            type: mongoose.Decimal128,
          },
          Content: {
            type: String,
          },
          UserId: {
            type: mongoose.Schema.Types.ObjectId,
          },
        },
      ],
    },
  },
});

module.exports = mongoose.model("Product", productSchema);
