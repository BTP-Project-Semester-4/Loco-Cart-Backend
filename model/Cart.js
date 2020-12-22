const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required:true
  },
  itemList:{
    type: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity:{
          type: Number
        }
      }
    ],
    required: true
  },
  totalPrice:{
    type: Number,
    required: true
  },
  timeStamp:{
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("Cart",cartSchema);