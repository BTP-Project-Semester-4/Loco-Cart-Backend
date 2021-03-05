const express = require("express");
const Order = require("../model/Order.js");
const expressAsyncHandler = require("express-async-handler");
const env = require('dotenv');
const customerPastOrderRouter = express.Router();

customerPastOrderRouter.post(
    "/customer_past_order", (req,res) => {
    Order.find({ customerId : req.body.customerId })
        .exec((err, history) => {
        if (err) {
            return res.status(422).json({ error: err });
          }
          else
            return res.json({ history });
    })
});

module.exports = customerPastOrderRouter;