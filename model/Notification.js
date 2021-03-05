const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  notifications: [
    {
      heading: {
        type: String,
      },
      link: {
        type: String,
      },
      description: {
        type: String,
      },
      image: {
        type: String,
      },
      timeStamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});
module.exports = mongoose.model("Notification", notificationSchema);
