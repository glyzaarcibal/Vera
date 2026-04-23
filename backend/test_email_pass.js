import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  console.log("Testing email with USER:", process.env.EMAIL_USER);
  console.log("Testing email with PASS:", process.env.EMAIL_PASS);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to self
      subject: "Test Email",
      text: "This is a test email.",
    });
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email Error:", error);
  }
}

testEmail();
