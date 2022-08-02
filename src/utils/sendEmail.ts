"use strict";
import nodemailer from 'nodemailer';

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  
  // let testAccount = await nodemailer.createTestAccount();
  
  // Log the test account & get the user and pass to hardcode it into the auth object for the createTransport function
  // console.log(`Nodemailer test account is ${JSON.stringify(testAccount)}`)

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'xodmqjen4yaraooa@ethereal.email', // generated ethereal user
      pass: 'cttNdGQqgEphBE54kD', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to, // List of receivers
    subject: "Change password", // Subject line
    html, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}