const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Customer = require("../model/Customer.js");
const Cart = require("../model/Cart.js");
const expressAsyncHandler = require("express-async-handler");
const nodemailer = require('nodemailer')
const env = require('dotenv');

const customerRouter = express.Router();

customerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    if(!req.body.email){
      return res.status(422).send({message:"Please enter email id"});
    }else if(!req.body.password){
      return res.status(422).send({message:"Please enter password"});
    }
    const customer = await Customer.findOne({ email: req.body.email });
    if (customer) {
      if (bcrypt.compareSync(req.body.password, customer.password)) {
        var token = jwt.sign({
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          isAuthenticated: customer.isAuthenticated
        },process.env.JWT_SECRET);
        return res.status(200).json({token,message: "Success",isAuthenticated: customer.isAuthenticated});
      }
    }
    res.status(401).send({ message: "Invalid email or password" });
  })
);

customerRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    //CHECKING WHETHER CUSTOMER WITH GIVEN EMAIL EXISTS IN THE DATABASE OR NOT
    const user = await Customer.findOne({email:req.body.email});
    if(user){
      return res.status(200).send({message:"Customer with this email already exists"});
    }

    //GENERATING A 6 DIGIT OTP
    var digits = '0123456789';
    let OTP = '';
    for(let i=0;i<6;i++){
      OTP+= digits[Math.floor(Math.random()*10)];
    }

    //SENDING OTP TO GIVEN EMAIL USING NODE-MAILER
    let transporter = nodemailer.createTransport({
      service:'gmail',
      auth:{
        user: process.env.COMPANY_EMAIL,
        pass: process.env.COMPANY_PASSWORD
      }
    });

    let mailOptions = {
      from: process.env.COMPANY_EMAIL,
      to: req.body.email,
      subject: 'One Time Password for email verification',
      text: `Welcome to Lococart...You are just one step away from verifying your email.
            Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`
    }

    transporter.sendMail(mailOptions,function(err,data){
      if(err){
        console.log("Error :",err);
      }else{
        console.log("OTP Email sent successfully");
      }
    })

    //SAVING THE NEW CUSTOMER IN THE DATABASE
    const customer = new Customer({
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      contactNo: req.body.contactNo,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      password: bcrypt.hashSync(req.body.password, 8),
      otp: OTP,
      isAuthenticated:false,
    });
    const createCustomer = await customer.save();
    res.send({
      name: createCustomer.name,
      email: createCustomer.email,
      contactNo: createCustomer.contactNo,
      address: createCustomer.address,
      city: createCustomer.city,
      state: createCustomer.state,
      country: createCustomer.country,
      password: createCustomer.password,
      profilePictureUrl: createCustomer.profilePictureUrl,
    });
  })
);

customerRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const customer = await Customer.findOne({ _id: customerId });
    if (customer) {
      //ratings/reviews to be sent once they are added to customer schema
      return res.status(200).send({
        _id: customer._id,
        name: customer.name,
        profilePictureUrl: customerId.profilePictureUrl,
      });
    }
    return res
      .status(400)
      .send({ message: "Could not find the requested resource" });
  })
);

customerRouter.get(
  "/getcart",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const myCart = await Cart.findOne({ customerId: customerId });
    if (myCart) {
      return res.status(200).send({
        _id: myCart.customerId,
        itemList: myCart.itemList,
        totalPrice: myCart.totalPrice,
        timeStamp: myCart.timeStamp,
      });
    }
    return res.status(201).send({ message: "Your Cart is empty" });
  })
);

customerRouter.post(
  "/placeorder",
  expressAsyncHandler(async (req, res) => {
    const cart = new Cart({
      customerId: req.params.customerId,
      sellerId: req.params.sellerId,
      itemList: req.params.itemList,
      totalPrice: req.params.totalPrice,
    });
    const createCart = await cart.save();
    res.send({
      _id: createCart._id,
      customerId: createCart.customerId,
      sellerId: createCart.sellerId,
      itemList: createCart.itemList,
      totalPrice: createCart.totalPrice,
    });
  })
);

module.exports = customerRouter;
