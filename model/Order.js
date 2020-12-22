const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
     customerId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Customer",
       required:true
     },
     seller:{
       type: [
          {
           type: mongoose.Schema.Types.ObjectId,
           ref:"Seller"
          }
       ],
       default:[]
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
     isBid:{
       type: Boolean,
       default: false
     },
     totalPrice:{
       type: Number,
       required: true
     },
     orderedAt:{
       type: Date,
       default: Date.now
     }
  }
);

module.exports = mongoose.model("Order", orderSchema);