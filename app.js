// DECLARING MODULES
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
const sellerRoute = require("./router/SellerRouter.js");
const customerRoute = require("./router/CustomerRouter.js");
const sellerProductRoute = require("./router/SellerProducts.js");
const sellerPastOrderRoute = require("./router/SellerPastOrder.js");
const customerPastOrderRouter = require("./router/CustomerPastOrder.js");
const categoryProductRouter = require("./router/CategoryProducts.js");
const product = require("./router/Product.js");
const applicationRunning = require("./router/api.js");
const reviewAndComments = require("./router/ReviewAndComments.js");
const feedbackRouter = require("./router/Feedbacks.js");
const BiddingRouter = require('./router/BiddingRouter');
const biddingRouter = require("./router/BiddingRouter");
//DEFINING MODULES
const app = express();
const port = 3001 || process.env.PORT;
const hostname = "localhost";

//VALIDATING MODULES POLICY
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
env.config();

//CONNECTING MONGO DB
const url = process.env.MONGODB;
mongoose.connect(`${url}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

// SENDING TO ROUTES
app.use("/api", applicationRunning);
app.use("/api/seller", sellerRoute);
app.use("/api/customer", customerRoute);
app.use("/api/seller_product", sellerProductRoute);
app.use("/api/sellerpastorder", sellerPastOrderRoute);
app.use("/api/customerpastorder", customerPastOrderRouter);
app.use("/api/categoryproducts", categoryProductRouter);
app.use("/api/product", product);
app.use("/api/reviewandcomment", reviewAndComments);
app.use("/api/feedback", feedbackRouter);
app.use("/api/bid",biddingRouter);

//STARTING APP
app.listen(process.env.PORT || 3001, () => {
  console.log(`Server Running at http://${hostname}:${port}/`);
});
