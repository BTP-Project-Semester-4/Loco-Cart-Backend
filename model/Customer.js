const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  password: { type: String, default: false, required: true },

  profilePictureUrl: {
    type: String,
    default:
      "https://www.google.com/search?q=customer+images&rlz=1C1CHBF_enIN885IN885&sxsrf=ALeKk02awGXRDl40Og89g34sTCPeJprt0g:1608365407831&source=lnms&tbm=isch&sa=X&ved=2ahUKEwiB2LWGzNntAhVcyTgGHW3QD7MQ_AUoAXoECA8QAw&biw=1280&bih=648#imgrc=QvpZcdR4cdC_IM",
    required: false,
  },
});
module.exports = mongoose.model("Customer", customerSchema);
