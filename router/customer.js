const express = require('express');
const Customer = require('../model/Customer');
const asyncHandler = require('express-async-handler');

const customer = express.Router();

customer.get(
    '/:id',
    asyncHandler(async(req,res)=>{
        const customerId = req.params.id;
        const customer = await Customer.findOne({_id:customerId});
        if(customer){
            //ratings/reviews to be sent once they are added to customer schema 
            return res.status(200).send({
                _id: customer._id,
                name: customer.name,
                profilePictureUrl: customerId.profilePictureUrl
            })
        }
        return res.status(400).send({message:"Could not find the requested resource"});
    })
)

module.exports = customer;