import supabaseAdmin from "./utils/supabase.utils.js";

async function testGenerateLink(email) {
    try {
        console.log(`Testing generateLink for: ${email}`);
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
        });

        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Supabase Success:", data);
            const { properties } = data;
            const token = properties?.verification_token || properties?.hashed_token;
            if (token) {
                console.log("Attempting to send email with token:", token);
                const { sendPasswordResetEmail } = await import("./service/Email.service.js");
                const resetLink = `http://localhost:5173/update-password?token=${token}`;
                await sendPasswordResetEmail(email, resetLink);
                console.log("Email sent successfully!");
            } else {
                console.error("No token found in properties:", properties);
            }
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

const email = process.argv[2];
if (!email) {
    console.log("Please provide an email as argument");
    process.exit(1);
}

testGenerateLink(email);
