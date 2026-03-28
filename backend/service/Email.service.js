import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

// Configure SendGrid API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log("SendGrid: API Key configured.");
} else {
  console.warn("SendGrid: SENDGRID_API_KEY is missing in .env");
}

// Helper to get synced email config
const getEmailConfig = () => {
  const fromEmail = (process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || "").trim();
  const fromName = (process.env.EMAIL_FROM_NAME || "Vera").trim();
  return { fromEmail, fromName };
};

/**
 * Common SendGrid error handler
 */
const handleSendGridError = (emailType, error) => {
  console.error(`Error sending ${emailType} email:`, error);
  if (error.response) {
    console.error(error.response.body);
  }
  throw error;
};

export const sendVerificationCodeEmail = async (email, code) => {
  // Always log the code for development debugging
  console.log("-----------------------------------------");
  console.log(`[AUTH] Verification Code for ${email}: ${code}`);
  console.log("-----------------------------------------");

  const { fromEmail, fromName } = getEmailConfig();
  console.log(`[SendGrid] Attempting to send using: ${fromEmail}`);

  try {
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
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

    const response = await sgMail.send(msg);
    console.log("Verification code email sent via SendGrid");
    return response;
  } catch (error) {
    handleSendGridError("verification code", error);
  }
};

export const sendVerificationEmail = async (email, link) => {
  const { fromEmail, fromName } = getEmailConfig();

  try {
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
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

    const response = await sgMail.send(msg);
    console.log("Verification email sent via SendGrid");
    return response;
  } catch (error) {
    handleSendGridError("verification", error);
  }
};

export const sendPasswordResetEmail = async (email, link) => {
  const { fromEmail, fromName } = getEmailConfig();

  try {
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
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

    const response = await sgMail.send(msg);
    console.log("Password reset email sent via SendGrid");
    return response;
  } catch (error) {
    handleSendGridError("password reset", error);
  }
};
export const sendGuardianVerificationEmail = async (email, code, childName) => {
  // Always log the code for development debugging
  console.log("-----------------------------------------");
  console.log(`[GUARDIAN] Verification Code for ${email}: ${code}`);
  console.log("-----------------------------------------");

  const { fromEmail, fromName } = getEmailConfig();

  try {
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Action Required: Guardian Consent for Vera",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f4f7f6; border-radius: 12px; border: 1px solid #e0e0e0;">
          <h2 style="color: #4a148c; text-align: center;">Guardian Consent Required</h2>
          <p style="color: #333; font-size: 16px;">Hello,</p>
          <p style="color: #333; font-size: 16px;"><strong>${childName}</strong> is attempting to create an account on <strong>Vera</strong> (AI-powered mental wellness companion). As they are under 19, your consent is required.</p>
          <p style="color: #333; font-size: 16px;">Please provide the following verification code to the applicant to approve their registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background-color: #4a148c; color: white; padding: 15px 40px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
              ${code}
            </div>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">This code will expire in 15 minutes.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">If you did not authorize this request, please ignore this email.</p>
            <p style="font-size: 12px; color: #999;">Vera - Your AI mental wellness companion.</p>
          </div>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    console.log("Guardian verification email sent via SendGrid");
    return response;
  } catch (error) {
    handleSendGridError("guardian verification", error);
  }
};
