import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function checkResources() {
    console.log("Checking 'resources' table...");
    const { data, error } = await supabase
        .from('resources')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error fetching resources:", error);
    } else {
        console.log("Successfully fetched resources:", data);
    }
}

checkResources();
