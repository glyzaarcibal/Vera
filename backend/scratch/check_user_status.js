import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('c:/Users/glena/risa/project1/Vera/backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function checkPendingUser() {
    const email = "risamaechan07@gmail.com";
    console.log(`Checking pending_users for: ${email}`);

    const { data, error } = await supabase
        .from('pending_users')
        .select('*')
        .eq('email', email);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Pending Users found:", JSON.stringify(data, null, 2));
    }
    
    // Also check if they exist in auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Auth Error:", authError);
    } else {
        const authUser = users.find(u => u.email === email);
        console.log("Auth User found:", authUser ? "YES" : "NO");
        if (authUser) {
            console.log("Auth User Details:", JSON.stringify(authUser, null, 2));
        }
    }
}

checkPendingUser();
