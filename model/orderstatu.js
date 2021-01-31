const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],
    orderStatus: [
      {
        type: {
          type: String,
          enum: ["ordered", "packed", "shipped", "delivered"],
          default: "ordered",
        },
        date: {
            type: Date,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Order", orderSchema);