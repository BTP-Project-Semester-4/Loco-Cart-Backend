const express = require("express");
const Seller = require("../model/Seller.js");
const Product = require("../model/Product.js");
const expressAsyncHandler = require("express-async-handler");
const env = require('dotenv');
const sellerProductRouter = express.Router();

sellerProductRouter.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
      const id = req.params.id;
      const allProducts = await Product.find();
      const sellerProducts = allProducts.filter((product)=>{
        if(product.Sellers.get(id) !== undefined){
          return true;
        }
      }).map((product)=>{
        const sellerProductDetails = product.Sellers.get(id)
        return {
          _id: product._id,
          Name: product.Name,
          Category: product.Category,
          sellerSpecificDetails: {
            _id: sellerProductDetails._id,
            SellerPrice: sellerProductDetails.SellerPrice,
            BiddingPrice: sellerProductDetails.BiddingPrice,
            Quantity: sellerProductDetails.Quantity,
            Image: sellerProductDetails.Image
          }
        }
      })
      if(sellerProducts.length>0)
        return res.status(200).send({sellerId:id,sellerProducts,message:"Success"});
      else
        return res.status(404).send({message:"Could not find the requested resource."})
    })
);

module.exports = sellerProductRouter;