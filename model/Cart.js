const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  itemList: {
    type: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        productName: {
          type: String,
          required: true,
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
        Description: {
          type: String,
          required: true,
        },
        Price: {
          type: Number,
          required: true,
        },
      },
    ],
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cart", cartSchema);
