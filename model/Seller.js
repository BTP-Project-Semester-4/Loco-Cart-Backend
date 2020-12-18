const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true },
  rating: { type: Number, default: 0, required: true },
  category: { type: String, required: true },
  homeDelivery: { type: Boolean, default: false, required: true },
  deliveryCharges: { type: Number, default: 0, required: false },
  location: { type: String, required: true },
  password: { type: String, default: false, required: true },
  profilePictureUrl: {
    type: String,
    default:
      "https://i0.wp.com/www.repol.copl.ulaval.ca/wp-content/uploads/2019/01/default-user-icon.jpg",
    required: true,
  },
});
const Order = mongoose.model("Seller", sellerSchema);
export default Seller;

