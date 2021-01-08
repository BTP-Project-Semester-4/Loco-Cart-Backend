const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../model/Customer.js");
const Cart = require("../model/Cart.js");
const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const env = require("dotenv");

const customerRouter = express.Router();

customerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    if (!req.body.email) {
      return res.send({ message: "Please enter email id" });
    } else if (!req.body.password) {
      return res.send({ message: "Please enter password" });
    } else {
      const customer = await Customer.findOne({ email: req.body.email });
      if (customer) {
        if (bcrypt.compareSync(req.body.password, customer.password)) {
          console.log(req.body.email + " password valid");
          const token = jwt.sign({ _id: customer._id }, process.env.JWT_SECRET);
          return res.send({
            _id: customer._id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            isAuthenticated: customer.isAuthenticated,
            message: "Success",
            token: token,
          });
        } else {
          console.log(req.body.email + " password not valid");
          res.send({
            message: "Invalid email or password",
          });
        }
      } else {
        console.log("Invalid email");
        res.send({
          message: "Invalid email or password",
        });
      }
    }
  })
);

customerRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    console.log(req.body.email + " requested to register");
    //CHECKING WHETHER CUSTOMER WITH GIVEN EMAIL EXISTS IN THE DATABASE OR NOT
    const user = await Customer.findOne({ email: req.body.email });
    if (user) {
      console.log(req.body.email + " already exist");
      return res.send({ message: "Customer with this email already exists" });
    } else {
      //GENERATING A 6 DIGIT  OTP
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
        to: req.body.email,
        subject: "One Time Password for email verification",
        text: `Welcome to Lococart...You are just one step away from verifying your email.
            Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`,
      };

      transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
          console.log("Error :", err);
        } else {
          console.log("OTP Email sent successfully");
        }
      });

      //SAVING THE NEW CUSTOMER IN THE DATABASE
      const customer = new Customer({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        address: req.body.address,
        contactNo: req.body.contactNo,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        password: bcrypt.hashSync(req.body.password, 8),
        otp: OTP,
        isAuthenticated: false,
      });
      const createCustomer = await customer.save();
      console.log(req.body.email + " customer created");
      res.send({
        firstName: createCustomer.firstName,
        lastName: createCustomer.lastName,
        email: createCustomer.email,
        contactNo: createCustomer.contactNo,
        address: createCustomer.address,
        city: createCustomer.city,
        state: createCustomer.state,
        country: createCustomer.country,
        password: createCustomer.password,
        profilePictureUrl: createCustomer.profilePictureUrl,
        message: "Success",
      });
    }
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
        name: customer.firstName,
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
