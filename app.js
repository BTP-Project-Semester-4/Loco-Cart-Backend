// DECLARING MODULES
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
const sellerRoute = require("./router/SellerRouter.js");
const customerRoute = require("./router/CustomerRouter.js");

//DEFINING MODULES
const app = express();
const port = 3001 || process.env.PORT;
const hostname = "localhost";

//VALIDATING MODULES POLICY
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
env.config();

const url = process.env.MONGODB;
mongoose.connect(`${url}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

app.use("/api/sellers", sellerRoute);
// app.use('/api/seller',seller);
// app.use('/api/customer',customer);
app.use("/api/customers", customerRoute);

//STARTING APP
app.listen(process.env.PORT || 3001, () => {
  console.log(`Server Running at http://${hostname}:${port}/`);
});
