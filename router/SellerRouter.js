const express = require("express");
const bcrypt = require("bcrypt");
const Seller = require("../model/Seller.js");
const expressAsyncHandler = require("express-async-handler");

const sellerRouter = express.Router();

sellerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const seller = await Seller.findOne({ email: req.body.email });
    if (seller) {
      if (bcrypt.compareSync(req.body.password, seller.password)) {
        res.send({
          _id: seller._id,
          name: seller.name,
          email: seller.email,
        });
        return;
      }
    }
    res.status(401).send({ message: "Invalid email or password" });
  })
);

sellerRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    const seller = new seller({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    const createSeller = await Seller.save();
    res.send({
      _id: createSeller._id,
      name: createSeller.name,
      email: createSeller.email,
      contactNo: createSeller.contactNo,
      rating: 0,
      category: createSeller.category,
      homeDelivery: createSeller.homeDelivery,
      deliveryCharges: createSeller.deliveryCharges,
      location: createSeller.location,
      password: createSeller.password,
      profilePictureUrl: createSeller.profilePictureUrl,
    });
  })
);
module.exports = sellerRouter;
