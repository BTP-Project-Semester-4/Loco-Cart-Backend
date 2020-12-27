const express = require("express");
const Seller = require("../model/Seller.js");
const Product = require("../model/Product.js");
const expressAsyncHandler = require("express-async-handler");
const env = require('dotenv');
const sellerProductRouter = express.Router();

sellerProductRouter.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
      const seller = await Seller.findOne({ _id: req.params.id });
      if (seller) {
        Product.find({ Seller_ID : req.params.id })
        .exec((err, product) => {
          if (err) {
            return res.status(422).json({ error: err });
          }
          res.json({ user, product });
        });
      }
      res.status(401).send({ message: "Seller Not Found" });
    })
);

module.exports = sellerProductRouter;