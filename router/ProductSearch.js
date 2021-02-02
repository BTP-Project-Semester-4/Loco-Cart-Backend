const express = require("express");
const Product = require("../model/Product.js");
const env = require("dotenv");
const productSearch = express.Router();

productSearch.post("/search", (req, res) => {
  const productName = req.body.name;
  let namePattern = new RegExp(productName, "i");
  Product.find({ Name: namePattern }).exec((err, products) => {
    if (err) {
      return res.status(422).json({ error: err });
    }
    return res.json({ products });
  });
});

productSearch.post("/searchbyid", (req, res) => {
  const productId = req.body.id;
  Product.findOne({ _id: productId }).exec((err, products) => {
    if (err) {
      return res.status(422).json({ error: err });
    }
    return res.json({ products });
  });
});

module.exports = productSearch;
