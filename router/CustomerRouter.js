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
    console.log(req.body.email + " requested to signin");
    if (customer) {
      console.log(req.body.email + " signin found in database");
      if (bcrypt.compareSync(req.body.password, customer.password)) {
        if (!customer.isAuthenticated) {
          console.log(req.body.email + " password valid");
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
            html: `<h1>Welcome to Lococart...</h1>
          <i>You are just one step away from verifying your email.</i><br/>
          Your OTP is:  <h2>${OTP}</h2>. <br/>Just Enter this OTP on the email verification screen`,
          });

          const updateOtp = await Customer.findOneAndUpdate(
            { _id: customer._id },
            { otp: { otpCode: OTP, timeStamp: Date.now() } },
            function (err, res) {
              if (err) {
                console.log(err);
              } else {
                console.log(
                  req.body.email + " OTP updation success with OTP: " + OTP
                );
              }
            }
          );
        }
        const token = jwt.sign({ _id: customer._id }, process.env.JWT_SECRET, {
          expiresIn: "28d",
        });
        return res.send({
          _id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          isAuthenticated: customer.isAuthenticated,
          message: "Success",
          CustomerToken: token,
        });
      } else {
        console.log("Invalid password");
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
  })
);

customerRouter.post(
  "/forgotpassword",
  expressAsyncHandler(async (req, res) => {
    if (!req.body.email) {
      return res.send({ message: "Please enter email id" });
    }
    const customer = await Customer.findOne({ email: req.body.email });
    if (customer) {
      console.log(req.body.email + " signin found in database");
      var digits = "0123456789";
      let newpasword = "";
      for (let i = 0; i < 6; i++) {
        newpasword += digits[Math.floor(Math.random() * 10)];
      }
      console.log(newpasword);

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
        subject: "New Password",
        html: `<h1>Welcome to Lococart...</h1>
          <i>System generated new password for your email.</i><br/>
          Your Password is:  <h2>${newpasword}</h2>. <br/>`,
      });
      // const userId = req.body.userId;
      const updateProfile = await Customer.findOneAndUpdate(
        { email: req.body.email },
        {
          $set: {
            password: bcrypt.hashSync(newpasword, 8),
          },
        }
      );
      res.status(200).send({
        message: "Mail Send",
      });
    } else {
      return res.send({ message: "Please enter valid email" });
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
        html: `<h1>Welcome to Lococart...</h1>You are just one step away from verifying your email.
          //       Your OTP is ${OTP}. Just Enter this OTP on the email verification screen`,
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

customerRouter.post(
  "/verifycustomertype",
  expressAsyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.body.id);
    return res.status(200).send({ isverified: customer.isAuthenticated });
  })
);

customerRouter.post(
  "/customerotp",
  expressAsyncHandler(async (req, res) => {
    console.log(req.body.otp);
    const customer = await Customer.findById(req.body.id);
    if ((req.body.timestamp - customer.otp.timeStamp) / (1000 * 60) > 5) {
      res.status(401).send({ message: "OTP Expired" });
    } else {
      if (req.body.otp === customer.otp.otpCode) {
        await Customer.findByIdAndUpdate(req.body.id, {
          isAuthenticated: true,
        });
        res.status(200).send({
          message: "Valid OTP...User Authenticated",
          token: customer.token,
        });
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
    console.log(customerId);
    try {
      const customer = await Customer.findOne({ _id: customerId });
      if (customer) {
        console.log(customer);
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
            address: customer.address,
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
        message: "Success",
      });
    } else {
      return res.status(201).send({ message: "Your Cart is empty" });
    }
  })
);

customerRouter.post(
  "/addtocart",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.body.customerId;
    const productId = req.body.productId;
    const productName = req.body.productName;
    const quantity = req.body.quantity;
    var cart = await Cart.findOne({ customerId: customerId });
    console.log(productId);
    if (cart) {
      var found = false;
      for (var i = 0; i < cart.itemList.length; i++) {
        if (cart.itemList[i].productId == productId) {
          cart.itemList[i].Quantity += Number(quantity);
          found = true;
          break;
        }
      }

      if (!found) {
        cart.itemList.push({
          productId: productId,
          productName: productName,
          Quantity: quantity,
        });
      }
      const savedCart = await cart.save();
      if (savedCart) {
        return res.status(200).send({ message: "Success", cart: savedCart });
      }
    } else {
      const newCart = new Cart({
        customerId: customerId,
        itemList: [
          {
            productId: productId,
            productName: productName,
            Quantity: quantity,
          },
        ],
      });
      const savedCart = await newCart.save();
      if (savedCart) {
        return res.status(200).send({ message: "Success", cart: savedCart });
      }
    }
  })
);

customerRouter.post(
  "/removefromcart",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.body.customerId;
    const productId = req.body.productId;
    var cart = await Cart.findOne({ customerId: customerId });
    console.log(productId);
    if (cart) {
      const updatedcart = await Cart.update(
        { customerId: customerId },
        { $pull: { itemList: { productId: productId } } }
      );
      return res.status(200).send({ message: "Success", updatedcart });
    } else {
      return res
        .status(200)
        .send({ message: "No item found !!!", cart: savedCart });
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

customerRouter.post(
  "/editprofile",
  expressAsyncHandler(async (req, res) => {
    const userId = req.body.userId;
    const userData = await Customer.findOne({ email: req.body.email });
    if (userData) {
      if (userData.isAuthenticated) {
        if (req.body.password) {
          const updateProfile = await Customer.findOneAndUpdate(
            { _id: userId },
            {
              $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                contactNo: req.body.contactNo,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                password: bcrypt.hashSync(req.body.password, 8),
                profilePictureUrl: req.body.profilePicUrl,
              },
            },
            function (err, res) {
              if (err) {
                console.log(err);
                res.send({ message: "could not update you profile :(" });
              } else {
                console.log(req.body.email + " profile updated !!!");
              }
            }
          );
          res.send({ updateProfile, message: "Success" });
        } else {
          const updateProfile = await Customer.findOneAndUpdate(
            { _id: userId },
            {
              $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                contactNo: req.body.contactNo,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                profilePictureUrl: req.body.profilePicUrl,
              },
            },
            function (err, res) {
              if (err) {
                console.log(err);
                res.send({ message: "could not update you profile :(" });
              } else {
                console.log(req.body.email + " profile updated !!!");
              }
            }
          );
          res.send({ updateProfile, message: "Success" });
        }
      } else {
        console.log(userData);
        res.send({ message: "please authorize your self :(" });
      }
    } else {
      res.send({ message: "customer not found :(" });
    }
  })
);

module.exports = customerRouter;
