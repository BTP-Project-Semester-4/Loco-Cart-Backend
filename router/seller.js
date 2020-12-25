const express = require('express');
const Seller = require('../model/Seller');
const asyncHandler = require('express-async-handler');

const seller = express.Router();

seller.get(
    '/:id',
    asyncHandler(async(req,res)=>{
        const sellerId = req.params.id;
        const seller = await Seller.findOne({_id:sellerId});
        if(seller){
            return res.status(200).send({
                _id: seller._id,
                name: seller.name,
                category: seller.category,
                rating: seller.rating,
                homeDelivery: seller.homeDelivery,
                location: seller.location,
                profilePictureUrl: seller.profilePictureUrl 
            });
        }
        return res.status(400).send({message:"Could not find the requested resource"});
    })
)

module.exports = seller;