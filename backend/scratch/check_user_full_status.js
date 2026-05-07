import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config(); // It should find .env in the parent dir if run from scratch/ or in current dir if run from backend/

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function checkUserStatus() {
    const email = "risamaechan07@gmail.com";
    console.log(`Checking status for: ${email}`);
    
    if (!process.env.SUPABASE_URL) {
        console.error("SUPABASE_URL is missing in process.env");
        process.exit(1);
    }

    // 1. Check Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Auth Error:", authError);
        process.exit(1);
    }
    
    const authUser = users.find(u => u.email === email);
    
    if (authUser) {
        console.log("User found in Auth pool. ID:", authUser.id);
        
        // 2. Check Profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
            
        if (profileError) {
            console.log("Profile not found or error:", profileError.message);
        } else {
            console.log("Profile found:", JSON.stringify(profile, null, 2));
        }
    } else {
        console.log("User NOT found in Auth pool.");
    }

    // 3. Check Pending
    const { data: pending, error: pendingError } = await supabase
        .from('pending_users')
        .select('*')
        .eq('email', email);
        
    console.log("Pending Users:", JSON.stringify(pending, null, 2));
}

checkUserStatus();
