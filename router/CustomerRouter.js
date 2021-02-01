const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Customer = require("../model/Customer.js");
const Cart = require("../model/Cart.js");
const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const env = require("dotenv");
const middleware = require("../middleware/middleware");

const customerRouter = express.Router();

customerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    if (!req.body.email) {
      return res.send({ message: "Please enter email id" });
    } else if (!req.body.password) {
      return res.send({ message: "Please enter password" });
    }
    const customer = await Customer.findOne({ email: req.body.email });
    if (customer) {
      if (bcrypt.compareSync(req.body.password, customer.password)) {
        //GENERATING A 6 DIGIT  OTP
        var digits = "0123456789";
        let OTP = "";
        for (let i = 0; i < 6; i++) {
          OTP += digits[Math.floor(Math.random() * 10)];
        }

        const transporter = nodemailer.createTransport(
          sendgridTransport({
            auth: {
              api_key: process.env.SEND_GRID,
            },
          })
        );

        transporter.sendMail({
          to: req.body.email,
          from: process.env.COMPANY_EMAIL,
          subject: "VERIFY LOCO-CART OTP",
          html: `Welcome to Lococart...You are just one step away from verifying your email.
          //       Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`,
        });

        console.log(req.body.email + " password valid");
        const token = jwt.sign({ _id: customer._id }, process.env.JWT_SECRET, {
          expiresIn: "24h",
        });
        return res.send({
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          isAuthenticated: customer.isAuthenticated,
          message: "Success",
          token: token,
        });
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

      // const transporter = nodemailer.createTransport(
      //   sendgridTransport({
      //     auth: {
      //       api_key: process.env.SEND_GRID,
      //     },
      //   })
      // );

      // transporter.sendMail({
      //   to: req.body.email,
      //   from: process.env.COMPANY_EMAIL,
      //   subject: "VERIFY LOCO-CART OTP",
      //   html: `Welcome to Lococart...You are just one step away from verifying your email.
      //     //       Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`,
      // });

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
        otp: { otpCode: OTP, timeStamp: Date.now() },
        isAuthenticated: false,
      });
      const createCustomer = await customer.save();
      console.log(req.body.email + " customer created");
      res.status(200).send({
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
  "/customerotp",
  middleware.isUnAuthenticated,
  expressAsyncHandler(async (req, res) => {
    return res.status(200).send({ message: "Access granted" });
  })
);

customerRouter.post(
  "/customerotp",
  middleware.requireSignin,
  expressAsyncHandler(async (req, res) => {
    console.log(req.user);
    console.log(req.body.otp);
    const customer = await Customer.findById(req.user._id);
    if ((req.body.timestamp - customer.otp.timeStamp) / (1000 * 60) > 5) {
      res.status(401).send({ message: "OTP Expired" });
    } else {
      if (req.body.otp === customer.otp.otpCode) {
        await Customer.findByIdAndUpdate(req.user._id, {
          isAuthenticated: true,
        });
        res.status(200).send({ message: "Valid OTP...User Authenticated" });
      } else {
        res.status(401).send({ message: "Invalid OTP" });
      }
    }
  })
);

customerRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    try {
      const customer = await Customer.findOne({ _id: customerId });
      if (customer) {
        //ratings/reviews to be sent once they are added to customer schema
        return res.status(200).send({
          message: "Success",
          customer: {
            _id: customer._id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            profilePictureUrl: customer.profilePictureUrl,
            email: customer.email,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            contactNo: customer.contactNo,
          },
        });
      }
      return res
        .status(400)
        .send({ message: "Could not find the requested resource" });
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Internal server error", error: err });
    }
  })
);

customerRouter.get(
  "/getcart/:id",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    console.log(req.params.id + " customer getcart");
    const myCart = await Cart.findOne({ customerId: customerId });
    if (myCart) {
      console.log(req.params.id + " customer getcart SUCCESS");
      return res.send({
        _id: myCart.customerId,
        itemList: myCart.itemList,
        totalPrice: myCart.totalPrice,
        timeStamp: myCart.timeStamp,
        message: "Success",
      });
    } else {
      return res.status(201).send({ message: "Your Cart is empty" });
    }
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
