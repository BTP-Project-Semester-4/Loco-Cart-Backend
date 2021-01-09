const jwt = require("jsonwebtoken");
const Customer = require('../model/Customer');
const Seller = require('../model/Seller');
const expressAsyncHandler = require("express-async-handler");

exports.requireSignin = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
  } else {
    return res.status(400).json({ error: "Authorization required" });
  }
  next();
};

exports.isUnAuthenticated = expressAsyncHandler(async(req,res,next)=>{
  {
    if(!req.headers.authorization){
      return res.status(401).json({ error: "Authorization required" });
    }else {
      const token = req.headers.authorization.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);
      const customer = await Customer.findById(user._id);
      if(customer.isAuthenticated){
        return res.status(401).json({ error: "Already authenticated" });
      }
    }
    next();
  }
})

exports.isUnAuthenticatedSeller = expressAsyncHandler(async(req,res,next)=>{
  {
    if(!req.headers.authorization){
      return res.status(401).json({ error: "Authorization required" });
    }else {
      const token = req.headers.authorization.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRET);
      const seller = await Seller.findById(user._id);
      if(seller.isAuthenticated){
        return res.status(401).json({ error: "Already authenticated" });
      }
    }
    next();
  }
})