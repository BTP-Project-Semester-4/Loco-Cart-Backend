const express = require("express");
const Order = require("../model/Order.js");
const expressAsyncHandler = require("express-async-handler");
const Currentbiddingwindow=require("../model/Currentbidding.js");
const env = require('dotenv');
const current_Active_orders_in_bidding_window= express.Router();
current_Active_orders_in_bidding_window.get(
    "/current_bidding_orders", (req,res) => {
        Currentbiddingwindow.find({productId: req.body.productId})
            .exec((err,current) => {
                if (err) {
                    return res.status(422).json({ error: err });
                }
                return res.json({current});
            })
    });

module.exports=current_Active_orders_in_bidding_window;