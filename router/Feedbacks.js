const express = require("express");
// const Feedback = require("./Feedback");
const expressAsyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const feedbackRouter = express.Router();
feedbackRouter.post("/", expressAsyncHandler(async(req, res) => {

    const emails = req.body.email;
    const name = req.body.name;
    const messages = req.body.message;
    console.log(emails);
    const transporter = nodemailer.createTransport(
        sendgridTransport({
            auth: {
                api_key: process.env.SEND_GRID,
            },
        })
    );
    transporter.sendMail({
        to: emails,
        from: process.env.COMPANY_EMAIL,
        subject: "Feedback",
        html: `<h1>Welcome to Lococart</h1>
           <p></p>
          <h2> Hello Mr. ${name} we have recieved your feedback</h2>
        
        <h3>${messages}</h3>`,
    });
}))
module.exports = feedbackRouter;