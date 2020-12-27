const express = require("express");
const bcrypt = require("bcrypt");
const Customer = require("../model/Customer");
const expressAsyncHandler = require("express-async-handler");

const customerRouter = express.Router();

customerRouter.post(
    "/signin",
    expressAsyncHandler(async (req, res) => {
        const customer = await Customer.findOne({ email: req.body.email });
        if (customer) {
            if (bcrypt.compareSync(req.body.password,customer.password)) {
                res.send({
                    name: customer.name,
                    email:customer.email,
                });
                return;
            }
        }
        res.status(401).send({ message: "Invalid email or password" });
    })
);

customerRouter.post(
    "/register",
    expressAsyncHandler(async (req, res) => {
        const customer = new customer({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
        });
        const createCustomer = await Customer.save();
        res.send({
            name: createCustomer.name,
            email: createCustomer.email,
            contactNo: createCustomer.contactNo,
            location: createCustomer.location,
            password: createCustomer.password,
            profilePictureUrl: createCustomer.profilePictureUrl,
        });
    })
);
module.exports =customerRouter;