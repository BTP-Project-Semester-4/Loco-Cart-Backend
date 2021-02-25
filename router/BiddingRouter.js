const express = require('express');
const Bid = require('../model/Bid');
const Customer = require('../model/Customer');
const Product = require('../model/Product');
const Seller = require('../model/Seller');
const expressAsyncHandler = require("express-async-handler");
const biddingRouter = express.Router();
const nodemailer = require("nodemailer");
const _ = require('lodash');
const env = require("dotenv").config();

biddingRouter.post(
    '/getinitialbestseller',
    expressAsyncHandler(async (req,res)=>{
        try{
            const itemList = req.body.itemList;
            const city = req.body.city;
            const sellers = await Seller.find({city: city});
            var sellerList = [];
            var priceMap = new Map();
             sellers.forEach(seller=>{
                sellerList.push(seller._id.toString());
                priceMap.set(seller._id.toString(),0);
            })
            for(var i=0;i<itemList.length;i++){
                const item = itemList[i];
                const product = await Product.findById(item.itemId);
                const sellerMap = product.Sellers;
                var eligibleSellers = [];
                sellerList.forEach(seller=>{
                    if(sellerMap.has(seller)){
                        if(sellerMap.get(seller).Quantity >= item.quantity){
                            eligibleSellers.push(seller);
                            priceMap.set(seller,priceMap.get(seller)+Number(item.quantity)*Number(sellerMap.get(seller).SellerPrice));
                        }
                    }
                });
                console.log("1",eligibleSellers)
                sellerList = _.intersection(sellerList,eligibleSellers);
                console.log("2",sellerList)
            }
            console.log(priceMap)
            var minPrice=Number.MAX_SAFE_INTEGER,minSeller=undefined;
            for(var i=0;i<sellerList.length;i++){
                if(priceMap.get(sellerList[i])<minPrice){
                    minPrice=priceMap.get(sellerList[i]);
                    minSeller=sellerList[i];
                }
            }
            if(minSeller!==undefined){
                const sellerDetails = await Seller.findById(minSeller);
                return res.status(200).send({
                    message: "Success",
                    minPrice: minPrice,
                    seller: {
                        firstName: sellerDetails.firstName,
                        lastName: sellerDetails.lastName,
                        address: sellerDetails.address,
                        city: sellerDetails.city,
                        interest: sellerDetails.category
                    }
                })
            }else{
                return res.status(404).send({message: "Could not find te requested resource"});
            }
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

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
                bids: [{
                    biddingPrice: price,
                    sellerId: sellerId
                }],
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

biddingRouter.get(
    '/getactivebids',
    expressAsyncHandler(async (req,res)=>{
        try{
            const city = req.body.city;
            var bids = await Bid.find({city:city});
            bids = bids.filter(bid=>(Date.now()-bid.orderedAt)/(1000*60)<180)
            return res.status(200).send({message: "Success",bids: bids});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

biddingRouter.get(
    '/:id',
    expressAsyncHandler(async (req,res)=>{
        try{
            const bid = await Bid.findById(req.params.id);
            if(bid){
                return res.status(200).send({message:"Success",bid: bid});
            }else{
                return res.status(404).send({message:"Could not find the requested resource"});
            }
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
);

biddingRouter.post(
    '/:id',
    expressAsyncHandler(async (req,res)=>{
        try{
            const price = req.body.price;
            const sellerId = req.body.sellerId;
            const bid = await Bid.findById(req.params.id);
            if((Date.now - bid.orderedAt)/(1000*60)<180){
                if(price < bid.bids[bid.bids.length-1].biddingPrice){
                    const seller = await Seller.findById(sellerId);
                    if(seller){
                        const bidItems = bid.itemList;
                        for(var i=0;i<bidItems.length;i++){
                            const product = Product.findById(bidItems[i].itemId);
                            const sellerMap = product.Sellers;
                            if(sellerMap.has(sellerId)){
                                if(sellerMap.get(sellerId).Quantity < bidItems[i].quantity){
                                    return res.status(200).send({message:"Insufficient item availability from the seller side"});
                                }
                            }else{
                                return res.status(200).send({message:"Insufficient item availability from the seller side"});
                            }
                        }
                        const bidsArray = bid.bids;
                        bidsArray.push({
                            biddingPrice: price,
                            sellerId: sellerId
                        });
                        const updatedBid = await Bid.updateOne({_id: req.params.id},
                            {
                                $set:{
                                    bids: bidsArray
                                }
                            });
                        return res.status(200).send({message: "Success", updatedBid: updatedBid});
                    }else{
                        return res.status(404).send({message: "Seller not found"})
                    }
                }else{
                    return res.status(200).send({message: "Please enter an amount lower than the current lowest bid"});
                }
            }else{
                return res.status(200).send({message: "Bidding period expired"});
            }
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
);

module.exports = biddingRouter;