const express = require("express");
const bcrypt = require("bcrypt");
const Customer = require("../model/Customer.js");
const Cart = require("../model/Cart.js");
const expressAsyncHandler = require("express-async-handler");

const customerRouter = express.Router();

customerRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const customer = await Customer.findOne({ email: req.body.email });
    if (customer) {
      if (bcrypt.compareSync(req.body.password, customer.password)) {
        res.send({
          _id: customer._id,
          name: customer.name,
          email: customer.email,
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
    const customer = new Customer({
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      contactNo: req.body.contactNo,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    const createCustomer = await customer.save();
    res.send({
      name: createCustomer.name,
      email: createCustomer.email,
      contactNo: createCustomer.contactNo,
      address: createCustomer.address,
      city: createCustomer.city,
      state: createCustomer.state,
      country: createCustomer.country,
      password: createCustomer.password,
      profilePictureUrl: createCustomer.profilePictureUrl,
    });
  })
);

customerRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const customer = await Customer.findOne({ _id: customerId });
    if (customer) {
      //ratings/reviews to be sent once they are added to customer schema
      return res.status(200).send({
        _id: customer._id,
        name: customer.name,
        profilePictureUrl: customerId.profilePictureUrl,
      });
    }
    return res
      .status(400)
      .send({ message: "Could not find the requested resource" });
  })
);

customerRouter.get(
  "/getcart",
  expressAsyncHandler(async (req, res) => {
    const customerId = req.params.id;
    const myCart = await Cart.findOne({ customerId: customerId });
    if (myCart) {
      return res.status(200).send({
        _id: myCart.customerId,
        itemList: myCart.itemList,
        totalPrice: myCart.totalPrice,
        timeStamp: myCart.timeStamp,
      });
    }
    return res.status(201).send({ message: "Your Cart is empty" });
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

module.exports = customerRouter;
