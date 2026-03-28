import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "risaatino7@gmail.com",
  from: process.env.EMAIL_FROM,
  subject: "Test Email from Vera",
  text: "If you see this, SendGrid is working.",
};

sgMail.send(msg)
  .then(() => console.log("Test email sent successfully"))
  .catch((error) => console.error("Test email failed:", error.response ? error.response.body : error));
