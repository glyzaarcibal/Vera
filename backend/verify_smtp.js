import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ override: true });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log("Attempting to connect to Gmail...");
console.log(`User: ${process.env.EMAIL_USER}`);

transporter.verify(function (error, success) {
    if (error) {
        console.error("\n❌ Connection Failed!");
        console.error("Error Code:", error.code);
        console.error("Response:", error.response);

        if (error.code === 'EAUTH') {
            console.log("\n💡 SUGGESTION: Invalid Credentials.");
            console.log("1. Ensure 2-Step Verification is ON for your Google Account.");
            console.log("2. Generate an 'App Password' (not your login password).");
            console.log("3. Update EMAIL_PASS in .env with the 16-character App Password.");
        }
    } else {
        console.log("\n✅ SMTP Connection Successful!");
        console.log("Server is ready to take our messages");
    }
});
