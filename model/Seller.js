const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true, unique: true },
  rating: { type: Number, default: 0, required: false },
  category: { type: String, required: true },
  homeDelivery: { type: Boolean, default: 0, required: true },
  deliveryCharges: { type: Number, default: 0, required: false },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  password: { type: String, default: false, required: true },
  otp:{type: String},
  isAuthenticated: {type:Boolean, default:false},
  profilePictureUrl: {
    type: String,
    default:
      "https://i0.wp.com/www.repol.copl.ulaval.ca/wp-content/uploads/2019/01/default-user-icon.jpg",
    required: false,
  },
});
module.exports = mongoose.model("Seller", sellerSchema);
