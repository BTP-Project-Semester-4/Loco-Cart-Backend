const express = require("express");
const Order = require("../model/Order.js");
const expressAsyncHandler = require("express-async-handler");
const env = require('dotenv');
const sellerPastOrderRouter = express.Router();

sellerPastOrderRouter.get(
    "/seller_past_order", (req,res) => {
    Order.find({ sellerId : req.body.sellerId })
        .exec((err, history) => {
          if (err) {
            return res.status(422).json({ error: err });
          }
          return res.json({ history });
    })
});

module.exports = sellerPastOrderRouter;