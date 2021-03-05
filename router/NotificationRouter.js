const express = require("express");
const Notification = require("../model/Notification");
const expressAsyncHandler = require("express-async-handler");

const notificationRouter = express.Router();

notificationRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const heading = req.body.heading;
    const description = req.body.description;
    const link = req.body.link;
    const image = req.body.image;
    const receiverId = req.body.receiverId;

    const notification = await Notification.findOne({ userId: receiverId });
    if (notification) {
      notification.notifications.push({
        heading: heading,
        description: description,
        link: link,
        image: image,
      });
      await notification.save();
      return res.send({
        message: "Success",
      });
    } else {
      const newNotification = new Notification({
        userId: receiverId,
        notifications: [
          {
            heading: heading,
            description: description,
            link: link,
            image: image,
          },
        ],
      });
      const saveNotification = await newNotification.save();
      if (saveNotification) {
        return res.send({
          message: "Success",
        });
      } else {
        return res.send({
          message: "Some error occured",
        });
      }
    }
  })
);
notificationRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;

    try {
      const notification = await Notification.findOne({ userId: userId });
      if (notification) {
        res.send({
          notification,
          message: "Success",
        });
      } else {
        res.send({
          message: "Your cart is empty",
        });
      }
    } catch (error) {
      res.send({
        message: error,
      });
    }
  })
);
module.exports = notificationRouter;
