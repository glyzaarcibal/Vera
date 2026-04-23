import supabaseAdmin from "./utils/supabase.utils.js";
import { findUserByEmail } from "./service/Auth/Auth.service.js";

async function testFindUser() {
    console.log("Testing findUserByEmail...");
    try {
        const user = await findUserByEmail("risamaechan8@gmail.com");
        console.log("User found:", user ? user.email : "Not found");
        
        // Test listUsers directly
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            console.error("listUsers error:", error);
        } else {
            console.log("listUsers success, count:", data.users.length);
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

testFindUser();
