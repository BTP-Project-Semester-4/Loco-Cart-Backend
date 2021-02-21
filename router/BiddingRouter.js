const express = require('express');
const Bid = require('../model/Bid');
const Customer = require('../model/Customer');
const expressAsyncHandler = require("express-async-handler");
const biddingRouter = express.Router();
const nodemailer = require("nodemailer");
const env = require("dotenv").config();

biddingRouter.post(
    "/getotp",
    expressAsyncHandler(async (req,res)=>{
        try{
            const customer = await Customer.findById(req.body.customerId);
        
            //GENERATING A 6 DIGIT OTP
            var digits = "0123456789";
            let OTP = "";
            for (let i = 0; i < 6; i++) {
                OTP += digits[Math.floor(Math.random() * 10)];
            }

            //SENDING OTP TO GIVEN EMAIL USING NODE-MAILER
            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                user: process.env.COMPANY_EMAIL,
                pass: process.env.COMPANY_PASSWORD,
                },
            });

            let mailOptions = {
                from: process.env.COMPANY_EMAIL,
                to: customer.email,
                subject: "One Time Password for email verification",
                text: `Welcome to Lococart...You are just one step away from placing your order.
                    Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`,
            };

            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                console.log("Error :", err);
                } else {
                console.log("OTP Email sent successfully");
                }
            });
            res.status(200).send({message: "Success", otp:OTP});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

biddingRouter.post(
    '/placeorder',
    expressAsyncHandler(async (req,res)=>{
        try{
            const customerId = req.body.customerId;
            const sellerId = req.body.sellerId;
            const price = req.body.price;
            const itemList = req.body.itemList;
            const addressLine1 = req.body.addressLine1;
            const addressLine2 = req.body.addressLine2;
            const city = req.body.city;

            const bid = new Bid({
                customerId: customerId,
                initialSellerId: sellerId,
                initialPrice: price,
                itemList: itemList,
                addressLine1: addressLine1,
                addressLine2: addressLine2,
                city: city,
                bids: [],
                orderedAt: Date.now()
            });

            const createdBid = await bid.save();
            return res.status(200).send({message: "Success", createdBid: createdBid});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
);

module.exports = biddingRouter;