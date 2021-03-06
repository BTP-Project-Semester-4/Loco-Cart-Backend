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
        Quantity: {
          type: Number,
          required: true,
        }
      },
    ],
    required: true,
  }
});

module.exports = mongoose.model("Cart", cartSchema);
