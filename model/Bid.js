const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },
    initialSellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller"
    },
    addressLine1 :{
        type: String
    },
    addressLine2 :{
        type: String
    },
    city: {
        type: "String"
    },
    initialPrice: {
        type: Number
    },
    itemList: [
        {
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number
            }
        }
    ]
    ,
    bids: [
        {
            biddingPrice: {
                type: Number
            },
            sellerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Seller"
            }
        }
    ],
    orderedAt: {
        type: Date,
        default: Date.now
    },
    latestTime:{
        type:Date,
        default:-1
    }
})

module.exports = mongoose.model("Bid",bidSchema);