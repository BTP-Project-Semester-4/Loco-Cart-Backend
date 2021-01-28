const Order = require("./orderstatu");
const Cart=require("./Cart");

exports.addOrder = (req, res) => {
    Cart.deleteOne({customer:req.customerId}).exec((error, result) => {
      if (error) return res.status(400).json({ error });
      if (result) {
        req.body.customer = req.customerId;
        req.body.orderStatus = [
          {
            type: "ordered",
            date: new Date(),
            isCompleted: true,
          },
          {
            type: "packed",
            isCompleted: false,
          },
          {
            type: "shipped",
            isCompleted: false,
          },
          {
            type: "delivered",
            isCompleted: false,
          },
        ];
      }
    });
  };
  