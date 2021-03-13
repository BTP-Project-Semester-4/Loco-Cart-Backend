const express = require('express');
const Bid = require('../model/Bid');
const Customer = require('../model/Customer');
const Product = require('../model/Product');
const Seller = require('../model/Seller');
const Cart = require('../model/Cart');
const expressAsyncHandler = require("express-async-handler");
const biddingRouter = express.Router();
const nodemailer = require("nodemailer");
const _ = require('lodash');
const env = require("dotenv").config();

//TO GET THE CURRENT BEST SELLER BASED ON THE CART ITEMS AND CITY NAME
//TO BE CALLED AFTER COMPLETION OF 1ST STEP IN PLACE ORDER
biddingRouter.post(
    '/getinitialbestseller',
    expressAsyncHandler(async (req,res)=>{
        try{
            const cart = await Cart.findOne({customerId: req.body.id});
            if(cart){
                const itemList = cart.itemList;
                const city = req.body.city;
                //GET ALL SELLERS WITHIN THE GIVEN CITY
                const sellers = await Seller.find({city: city});
                //SELLERLIST IS AN ARRAY THAT WILL STORE ALL THE SELLERS WITHIN THE GIVEN
                //CITY OFFERING THE GIVEN CART ITEMS IN SUFFICIENT QUANTITY
                var sellerList = [];
                //MAKE A PRICE MAP WITH SELLER IDS AS KEY AND SET ALL INITIAL PROCES TO 0
                var priceMap = new Map();
                sellers.forEach(seller=>{
                    sellerList.push(seller._id.toString());
                    priceMap.set(seller._id.toString(),0);
                })
                //ITERATE THROUGH ALL THE ITEMS IN THE CART
                for(var i=0;i<itemList.length;i++){
                    const item = itemList[i];
                    const product = await Product.findById(item.productId);
                    const sellerMap = product.Sellers;
                    //ELIGIBLESELLERS IS ARRAY TO STORE ALL THE SELLERS WHICH 
                    //SELL ONE OF THE GIVEN PRODUCTS IN SUFFICIENT QUANTITY
                    var eligibleSellers = [];
                    sellerList.forEach(seller=>{
                        //CHECK FOR EXISTENCE
                        if(sellerMap.has(seller)){
                            //CHECK FOR SUFFICIENCY
                            if(sellerMap.get(seller).Quantity >= item.Quantity){
                                //EVERYTHING IS ALRIGHT...PUSH INTO ELIGIBLE SELLERS FOR THE GIVEN PRODUCT
                                eligibleSellers.push(seller);
                                priceMap.set(seller,priceMap.get(seller)+Number(item.Quantity)*Number(sellerMap.get(seller).SellerPrice));
                            }
                        }
                    });
                    console.log("1",eligibleSellers)
                    //MAKE AN INTERSECTION OF SELLERS SELLING THE GIVEN ITEM IN SUFFICIENT
                    //QUANTITY WITH THE SELLERS SELLING THE PREVIOUSLY ITERATED ITEMS
                    // IN SUFFICIENT QUANTITY AND STORE THE INTERSECTION IN SELLERLIST
                    sellerList = _.intersection(sellerList,eligibleSellers);
                    console.log("2",sellerList)
                }
                console.log(priceMap)
                var minPrice=Number.MAX_SAFE_INTEGER,minSeller=undefined;
                //ITERATE THROUGH ALL THE ELIGIBLE SELLERS TO GET THE ONE WITH MINIMUM PRICE
                for(var i=0;i<sellerList.length;i++){
                    if(priceMap.get(sellerList[i])<minPrice){
                        minPrice=priceMap.get(sellerList[i]);
                        minSeller=sellerList[i];
                    }
                }
                //IF ELIGIBLE SELLER EXISTS
                if(minSeller!==undefined){
                    //GET SELLER DETAILS
                    const sellerDetails = await Seller.findById(minSeller);
                    //WE NEED DEATILS OF EACH PRODUCT WITHIN THE CART SO WE'LL INITIALLY
                    //MAKE ONE FIND QUERY TO GET ALL THE PRODUCTS IN THE DATABASE INTO 
                    //ALLPRODUCTS ARRAY AND THEN ACCORDING TO THE CART ITEMS WE'LL
                    //GET THE ITEMS BY DOING FIND OPERATIONS WITHIN THIS ARRAY 
                    const allProducts = await Product.find({});
                    //ITEMDETAILS WILL CONTAIN THE DETAILS OF AN ITEM THAT WE'LL SEND TO THE FRONTEND
                    var itemDetails = [];
                    //FOR EVERY ITEM IN THE CART DO THE FOLLOWING
                    for(var i=0;i<itemList.length;i++){
                        //FIND THE GIVEN CART ITEM IN THE ALLPRODUCTS ARRAY
                        const item = allProducts.find(data=>String(data._id)==String(itemList[i].productId));
                        console.log(itemList[i].productId)
                        //PUSH THE RELEAVANT DETAILS IN THE ITEMDETAILS ARRAY
                        itemDetails.push({
                            id: itemList[i].productId,
                            name: item.Name,
                            category: item.Category,
                            image: item.Sellers.get(minSeller).Image,
                            minPrice: item.Sellers.get(minSeller).SellerPrice,
                            quantity: itemList[i].Quantity,
                            totalPrice: Number(item.Sellers.get(minSeller).SellerPrice)*Number(itemList[i].Quantity)
                        });
                    }
                    
                    return res.status(200).send({
                        message: "Success",
                        minPrice: minPrice,
                        itemDetails: itemDetails,
                        seller: {
                            sellerId: minSeller,
                            firstName: sellerDetails.firstName,
                            lastName: sellerDetails.lastName,
                            address: sellerDetails.address,
                            city: sellerDetails.city,
                            interest: sellerDetails.category,
                            image: sellerDetails.profilePictureUrl
                        }
                    })
                }else{
                    return res.status(404).send({message: "No seller available"});
                }
            }else{
                return res.status(404).send({message:"Cart empty"});
            } 
            
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

//ROUTE TO SEND OTP WHILE PLACING ORDER
//TO BE CALLED AFTER COMPLETION OF 2ND STEP OF PLACE ORDER
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

//ROUTE TO FINALLY PLACE THE ORDER/BID ONCE ALL THE STEPS ARE DONE
//TO BE CALLED AFTER ALL THE 3 STEPS OF PLACE ORDER ARE COMPLETED
biddingRouter.post(
    '/placeorder',
    expressAsyncHandler(async (req,res)=>{
        try{
            //GET ALL RELEAVANT DETAILS
            const customerId = req.body.customerId;
            const sellerId = req.body.initialSellerId;
            const price = req.body.price;
            const itemList = req.body.itemList;
            const addressLine1 = req.body.addressLine1;
            const addressLine2 = req.body.addressLine2;
            const city = req.body.city;

            //CREATE A NEW OBJECT
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

            //EMPTY THE CUSTOMER'S CART AFTER SUCCESSFULLY SAVING THE ORDER/BID
            var updateCart = await Cart.findOne({customerId: customerId});
            updateCart.itemList=[];
            updateCart.save();

            return res.status(200).send({message: "Success", createdBid: createdBid});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
);

//GET ALL ACTIVE BIDS WITHIN THE CITY OF A SELLER
biddingRouter.post(
    '/getactivebids',
    expressAsyncHandler(async (req,res)=>{
        try{
            //FIND THE RESPECTIVE SELLER WITHIN THE DATABSE
            const seller = await Seller.findById(req.body.id);
            //GET ALL THE PRODUCTS ARRAY
            const allProducts = await Product.find({});
            const city = seller.city;
            //FIND ALL THE BIDS WITHIN THE SELLER'S CITY
            var bids = await Bid.find({city:city});
            //FILTER THE BIDS BY PLACING THE CONDITION FOR THEIR EXPIRY,
            //I.E, CURRENT TIME-ORDEREDAT TIME < 3HRS(180 MINUTES)
            bids = bids.filter(bid=>(Date.now()-bid.orderedAt)/(1000*60)<180);
            //BIDITEMS WILL STORE NAME AND QUANTITY OF EACH ITEM IN THE BID
            var bidItems = [];
            //FOR EACH BID DO THE FOLLOWING
            bids.forEach(bid=>{
                var allItems = [];
                //FOR EACH ITEM WITHIN THE BID SO THE FOLLOWING
                bid.itemList.forEach(item=>{
                    const product = allProducts.find(product=>String(product._id)==String(item.itemId));
                    console.log(product);
                    //PUSH THE PRODUCT DETAILS INTO THE ALLITEMS ARRAY
                    allItems.push({
                        name: product.Name,
                        quantity: item.quantity
                    })
                })
                bidItems.push(allItems)
            })
            return res.status(200).send({message: "Success",bids: bids, bidItems: bidItems});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

//GET THE THE ORDERS/BIDS OF A CUSTOMER BOTH ONGOING AND EXPIRED
biddingRouter.post(
    '/getcustomerbids',
    expressAsyncHandler(async (req,res)=>{
        try{
            const allProducts = await Product.find({});
            //FIND ALL THE BIDS/ORDERS OF THE GIVEN CUSTOMER
            var bids = await Bid.find({customerId: req.body.customerId});
            var bidItems = [];
            //FOR EACH BID PUSH THE ITEM DETAILS FOR EACH OF ITS ITEMS INTO THE ALL ITEMS ARRAY
            //AND IN TURN PUSH THE ALL ITEMS ARRAY INTO THE BID ITEMS ARRAY
            bids.forEach(bid=>{
                var allItems = [];
                bid.itemList.forEach(item=>{
                    const product = allProducts.find(product=>String(product._id)==String(item.itemId));
                    console.log(product)
                    allItems.push({
                        name: product.Name,
                        quantity: item.quantity
                    })
                })
                bidItems.push(allItems)
            })
            return res.status(200).send({message: "Success",bids: bids, bidItems: bidItems});
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

//ROUTE TO PLACE THE BID ON AN ONGOING BID
//THIS ROUTE ID FOR SELLERS
biddingRouter.post(
    '/placebid',
    expressAsyncHandler(async (req,res)=>{
        try{
            console.log(req.body)
            console.log("adsds")
            const price = req.body.price;
            const sellerId = req.body.sellerId;
            const bid = await Bid.findById(req.body.bidId);
            //CHECK FOR BID EXPIRY
            if((Date.now() - bid.orderedAt)/(1000*60)<180){
                //CHECK WHETHER THE GIVEN BID IS SMALLER THAN THE CURRENT MINBID OR NOT
                if(price < bid.bids[bid.bids.length-1].biddingPrice){
                    const seller = await Seller.findById(sellerId);
                    console.log(seller);
                    //CHECK WHETHER GIVEN SELLER EXISTS OR NOT
                    if(seller){
                        const bidItems = bid.itemList;
                        console.log(bidItems)
                        //CHECK WHETHER THE GIVEN SELLER HAS THE BID ITEMS IN SUFFICIENT QUANTITY OR NOT
                        for(var i=0;i<bidItems.length;i++){
                            const product = await Product.findById(bidItems[i].itemId);
                            const sellerMap = product.Sellers;
                            //CHECK FOR EXISTENCE
                            if(sellerMap.has(sellerId)){
                                //CHECK FOR SUFFICIENCY
                                if(Number(sellerMap.get(sellerId).Quantity) < Number(bidItems[i].quantity)){
                                    return res.status(200).send({message:"Insufficient item availability from the seller side"});
                                }
                            }else{
                                return res.status(200).send({message:"Insufficient item availability from the seller side"});
                            }
                        }
                        //ALL CHECKS DONE....HENCE WE PUSH THE NEW BID
                        const bidsArray = bid.bids;
                        bidsArray.push({
                            biddingPrice: price,
                            sellerId: sellerId
                        });
                        const updatedBid = await Bid.updateOne({_id: req.body.bidId},
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

//GET THE DETAILS OF ONE SPECIFIC BID FOR THE SELLER SIDE
biddingRouter.post(
    '/:id',
    expressAsyncHandler(async (req,res)=>{
        try{
            const bid = await Bid.findById(req.params.id);
            const allSellers = await Seller.find({});
            const seller = allSellers.find(data=>String(data._id)==String(req.body.sellerId));
            console.log(req.body)
            if(seller){
                if(bid){
                    if(bid.city == seller.city){
                        const allProducts = await Product.find({});
                        console.log(bid)
                        //ARRAYS TO STORE DETAILS OF ALL THE BIDDING SELLERS AND PRODUCTS IN THE BIDS
                        var resProducts = [];
                        var resSellers = [];
                        //PUSH DETAILS OF EACH PRODUCT PRESENT IN THE BIDITEMS LIST
                        for(var i=0;i<bid.itemList.length;i++){
                            const product = allProducts.find(p=>String(p._id)==String(bid.itemList[i].itemId));
                            resProducts.push({
                                name: product.Name,
                                category: product.Category,
                                quantity: bid.itemList[i].quantity,
                                image: product.Sellers.get(String(bid.initialSellerId)).Image,
                            });
                        }
                        //PUSH DETAILS OF EACH SELLER WHO HAS PLACED A BID
                        for(var i=bid.bids.length-1;i>=0;i--){
                            const seller = allSellers.find(s=>String(s._id)==String(bid.bids[i].sellerId));
                            resSellers.push({
                                name: seller.firstName + " " + seller.lastName,
                                image: seller.profilePictureUrl,
                                biddingPrice: bid.bids[i].biddingPrice
                            });
                        }
                        return res.status(200).send({message:"Success",bid: bid,products: resProducts, sellers: resSellers});
                    }else{
                        return res.status(400).send({message:"Seller city not within bidding zone"})
                    }
                    
                }else{
                    return res.status(404).send({message:"Could not find the requested resource"});
                }
            }else{
                return res.status(404).send({message:"Invalid seller"});
            }
            
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
);

//BID DETAILS FOR THE CUSTOMER SIDE
biddingRouter.post(
    '/customer/:id',
    expressAsyncHandler(async (req, res)=>{
        try{
            const bid = await Bid.findById(req.params.id);
            //CHECK WHETHER THE FOUND BID BELONGS TO THE GIVEN CUSTOMER OR NOT
            if(String(bid.customerId)==String(req.body.customerId)){
                const allProducts = await Product.find({});
                const allSellers = await Seller.find({});
                //ARRAYS TO STORE DETAILS OF ALL THE BIDDING SELLERS AND PRODUCTS IN THE BIDS
                var resProducts = [];
                var resSellers = [];
                //PUSH DETAILS OF EACH PRODUCT PRESENT IN THE BIDITEMS LIST
                for(var i=0;i<bid.itemList.length;i++){
                    const product = allProducts.find(p=>String(p._id)==String(bid.itemList[i].itemId));
                    resProducts.push({
                        name: product.Name,
                        category: product.Category,
                        quantity: bid.itemList[i].quantity,
                        image: product.Sellers.get(String(bid.initialSellerId)).Image,
                    });
                }
                //PUSH DETAILS OF EACH SELLER WHO HAS PLACED A BID
                for(var i=bid.bids.length-1;i>=0;i--){
                    const seller = allSellers.find(s=>String(s._id)==String(bid.bids[i].sellerId));
                    resSellers.push({
                        name: seller.firstName + " " + seller.lastName,
                        image: seller.profilePictureUrl,
                        biddingPrice: bid.bids[i].biddingPrice
                    });
                }
                return res.status(200).send({message:"Success",bid: bid,products: resProducts, sellers: resSellers});
            }else{
                return res.status(404).send({message:"Could not find the requested resource"});
            }
        }catch(err){
            console.log("Internal server error\n",err);
            return res.status(500).send({message: "Internal server error"});
        }
    })
)

module.exports = biddingRouter;