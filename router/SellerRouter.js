const express = require("express");
const bcrypt = require("bcryptjs");
const Seller = require("../model/Seller.js");
const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const env = require("dotenv");
const sellerRouter = express.Router();
const sendgridTransport = require("nodemailer-sendgrid-transport");
const middleware = require("../middleware/middleware");
const jwt = require("jsonwebtoken");

sellerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    console.log("signin request seller " + req.body.email);
    const seller = await Seller.findOne({ email: req.body.email });
    if (seller) {
      if (bcrypt.compareSync(req.body.password, seller.password)) {
        console.log("seller " + req.body.email + " valid password");
        if (!seller.isAuthenticated) {
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

          const updateOtp = await Seller.findOneAndUpdate(
            { _id: seller._id },
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
        const token = jwt.sign({ _id: seller._id }, process.env.JWT_SECRET, {
          expiresIn: "28d",
        });
        res.send({
          _id: seller._id,
          firstName: seller.firstName,
          email: seller.email,
          city: seller.city,
          rating: seller.rating,
          message: "Success",
          token: token,
        });
        return;
      } else {
        console.log("seller " + req.body.email + " invalid password");
        res.send({ message: "Invalid email or password" });
      }
    } else {
      console.log("Invalid seller email");
      res.send({ message: "Invalid email or password" });
    }
  })
);

sellerRouter.post(
  "/forgotpassword",
  expressAsyncHandler(async (req, res) => {
    if (!req.body.email) {
      return res.send({ message: "Please enter email id" });
    }
    const seller = await Seller.findOne({ email: req.body.email });
    if (seller) {
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
      const updateProfile = await Seller.findOneAndUpdate(
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

sellerRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    console.log("seller " + req.body.email + " register requested");
    //CHECKING WHETHER SELLER WITH GIVEN EMAIL EXISTS IN THE DATABASE OR NOT
    const user = await Seller.findOne({ email: req.body.email });
    if (user) {
      console.log(req.body.email + " already exist");
      return res.send({ message: "Seller with this email already exists" });
    } else {
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

      //SAVING THE NEW SELLER IN TEH DATABASE
      const seller = new Seller({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        contactNo: req.body.contactNo,
        category: req.body.category,
        homeDelivery: req.body.homeDelivery,
        deliveryCharges: req.body.deliveryCharges,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        profilePictureUrl: req.body.profilePictureUrl,
        otp: { otpCode: OTP, timeStamp: Date.now() },
        isAuthenticated: false,
      });
      const createSeller = await seller.save();
      console.log("seller " + createSeller.email + " created");
      res.send({
        _id: createSeller._id,
        firstName: createSeller.firstName,
        lastName: createSeller.lastName,
        email: createSeller.email,
        contactNo: createSeller.contactNo,
        rating: 0,
        category: createSeller.category,
        homeDelivery: createSeller.homeDelivery,
        deliveryCharges: createSeller.deliveryCharges,
        address: req.body.address,
        city: createSeller.city,
        state: createSeller.state,
        country: createSeller.country,
        password: createSeller.password,
        profilePictureUrl: createSeller.profilePictureUrl,
        message: "Success",
      });
    }
  })
);

sellerRouter.post(
  "/verifysellertype",
  expressAsyncHandler(async (req, res) => {
    const seller = await Seller.findById(req.body.id);
    return res.status(200).send({ isverified: seller.isAuthenticated });
  })
);

sellerRouter.post(
  "/sellerotp",
  expressAsyncHandler(async (req, res) => {
    console.log(req.body.otp);
    const seller = await Seller.findById(req.body.sellerId);
    if ((req.body.timestamp - seller.otp.timeStamp) / (1000 * 60) > 5) {
      res.status(401).send({ message: "OTP Expired" });
    } else {
      if (req.body.otp === seller.otp.otpCode) {
        await Seller.findByIdAndUpdate(req.body.sellerId, {
          isAuthenticated: true,
        });
        res.status(200).send({ message: "Valid OTP...User Authenticated" });
      } else {
        res.status(401).send({ message: "Invalid OTP" });
      }
    }
  })
);

sellerRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const sellerId = req.params.id;
    try {
      const seller = await Seller.findOne({ _id: sellerId });
      if (seller) {
        return res.status(200).send({
          message: "Success",
          seller: seller,
        });
      }
      return res
        .status(400)
        .send({ message: "Could not find the requested resource" });
    } catch (err) {
      return res
        .status(400)
        .send({ message: "Could not find the requested resource" });
    }
  })
);

sellerRouter.post(
  "/editprofile",
  expressAsyncHandler(async (req, res) => {
    const userId = req.body.userId;
    const userData = await Seller.findOne({ email: req.body.email });
    if (userData) {
      if (userData.isAuthenticated) {
        if (req.body.password) {
          const updateProfile = await Seller.findOneAndUpdate(
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
          const updateProfile = await Seller.findOneAndUpdate(
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
      res.send({ message: "seller not found :(" });
    }
  })
);
module.exports = sellerRouter;
