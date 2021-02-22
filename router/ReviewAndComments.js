const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const Product = require("../model/Product.js");
const reviewAndComments = express.Router();

reviewAndComments.post(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const id = req.body.id;
    const reviewerName = req.body.name;
    const rating = req.body.rating;
    const comment = req.body.comment;
    const reviewerId = req.body.userId;
    // console.log(req.params.id);
    try {
      const product = await Product.findById(productId).exec(
        async (err, productDetails) => {
          if (productDetails) {
            // console.log("productDetails");
            const sellerMap = productDetails.Sellers;
            // console.log(sellerMap);
            if (sellerMap.has(id)) {
              // console.log("SellerMap");
              const sellerDetails = sellerMap.get(id);
              // console.log("SellerDetails");
              sellerDetails.Rating = parseFloat(
                (rating +
                  sellerDetails.Rating * sellerDetails.Comments.length) /
                  (sellerDetails.Comments.length + 1)
              ).toFixed(2);
              console.log("here " + sellerDetails.Rating);
              sellerDetails.Comments.push({
                Name: reviewerName,
                Rating: rating,
                Content: comment,
                UserId: reviewerId,
              });
              sellerMap.set(id, sellerDetails);
              const updatedProduct = await Product.updateOne(
                { _id: productId },
                {
                  $set: { Sellers: sellerMap },
                }
              );
              res.send({ updatedProduct, message: "Success" });
            }
          } else {
            return res.send("Product not found !!");
          }
        }
      );
    } catch (err) {
      return res
        .status(500)
        .send({ message: "Internal server error", error: err });
    }
  })
);

module.exports = reviewAndComments;
