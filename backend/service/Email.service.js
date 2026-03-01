import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ override: true });

console.log("Email Config:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  hasPass: !!process.env.EMAIL_PASS,
  from: process.env.EMAIL_FROM
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@vera.app",
      to: email,
      subject: "Verify Your Email Address - Vera",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #333;">Welcome to Vera!</h2>
          <p style="color: #555;">Please click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="color: #555;">Or copy and paste this link into your browser:</p>
          <p style="color: #777; word-break: break-all; font-size: 12px;">${link}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@vera.app",
      to: email,
      subject: "Reset Your Password - Vera",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555;">You requested a password reset. Please click the button below to choose a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #555;">Or copy and paste this link into your browser:</p>
          <p style="color: #777; word-break: break-all; font-size: 12px;">${link}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};
