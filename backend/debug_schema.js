import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function checkSchema() {
    console.log("Checking profiles table schema...");

    // Try to fetch one row and see the keys
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching from profiles:", error);
    } else if (data && data.length > 0) {
        console.log("Current columns in profiles:", Object.keys(data[0]));
    } else {
        // If no data, try to guess or use another method
        // We can try to insert a dummy and see the error
        const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: '00000000-0000-0000-0000-000000000000' }]);

        if (insertError) {
            console.log("Insert error (to see schema info):", insertError);
        }
    }

    // Check pending_users as well
    const { data: pendingData, error: pendingError } = await supabase
        .from('pending_users')
        .select('*')
        .limit(1);

    if (pendingError) {
        console.error("Error fetching from pending_users:", pendingError);
    } else if (pendingData && pendingData.length > 0) {
        console.log("Current columns in pending_users:", Object.keys(pendingData[0]));
        console.log("Sample metadata:", pendingData[0].user_metadata);
    }
}

checkSchema();
