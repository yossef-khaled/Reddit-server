"use strict";
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {
  
  let transporter = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    auth: {
      user: process.env.GMAIL_SMTP_USERNAME,
      pass: process.env.GMAIL_SMTP_PASSWORD
    }
  }));

  await transporter.sendMail({
    from: process.env.GMAIL_SMTP_USERNAME,
    to, 
    subject: "Change password",
    html,
  });
}