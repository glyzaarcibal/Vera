import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ override: true });

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("Nodemailer transporter error:", error);
  } else {
    console.log("Nodemailer: Server is ready to take our messages");
  }
});

export const sendVerificationCodeEmail = async (email, code) => {
  // Always log the code for development debugging
  console.log("-----------------------------------------");
  console.log(`[AUTH] Verification Code for ${email}: ${code}`);
  console.log("-----------------------------------------");

  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Vera"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code - Vera",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #ddd;">
          <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Thank you for signing up for Vera. Please use the following verification code to complete your registration:</p>
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background-color: #fff; border: 2px solid #4CAF50; color: #4CAF50; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              ${code}
            </div>
          </div>
          <p style="color: #555; font-size: 14px; text-align: center;">This code will expire in 10 minutes.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification code email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending verification code email:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (email, link) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Vera"}" <${process.env.EMAIL_USER}>`,
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
      from: `"${process.env.EMAIL_FROM_NAME || "Vera"}" <${process.env.EMAIL_USER}>`,
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

