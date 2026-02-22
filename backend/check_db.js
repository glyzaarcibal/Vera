import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function checkTables() {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .limit(1);

    if (error) {
        console.log("Error or table does not exist:", error.message);
    } else {
        console.log("Table 'activities' exists.");
    }
}

checkTables();
