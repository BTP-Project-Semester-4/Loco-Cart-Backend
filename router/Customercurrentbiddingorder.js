const express = require("express");
const Order = require("../model/Order.js");
const Currentbiddingwindow=require("../model/Currentbidding.js");
const expressAsyncHandler = require("express-async-handler");
const env = require('dotenv');
const customerCurrentactiveorderinbidwindowRouter = express.Router();
customerCurrentactiveorderinbidwindowRouter.get(
    "/customer_current_bidding_order", (req,res) => {
        Currentbiddingwindow.find({customerId : req.body.customerId })
            .exec((err,current) => {
                if (err) {
                    return res.status(422).json({ error: err });
                }
                return res.json({current});
            })
    });

module.exports=customerCurrentactiveorderinbidwindowRouter;