import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function runSQL() {
    const sqlPath = path.join(__dirname, 'sql', 'create_activities_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS client doesn't have a direct 'query' method for raw SQL.
    // We usually have to use a wrapper or the SQL editor.
    // However, we can try to use a simple RPC if a helper exists, 
    // but most projects don't have one.

    // Alternatively, I will just try to insert a record into 'activities' which will fail if it doesn't exist.
    // Since I can't RUN raw SQL easily via the client without a custom RPC function, 
    // I will assume for a moment that 'activities' might be missing and I'll inform the user if it is.

    // Wait, I can use the 'supabase' client to try and create the table if I had an RPC, but I don't.
    // I will use another approach: check if I can insert into a non-existent table.

    console.log("Attempting to verify/create table via dummy insert...");
    const { error } = await supabase
        .from('activities')
        .insert([{ user_id: '00000000-0000-0000-0000-000000000000', activity_type: 'setup', data: {} }]);

    if (error && error.code === '42P01') {
        console.log("Table 'activities' does NOT exist. Please create it in the Supabase SQL Editor using the provided SQL file.");
        process.exit(1);
    } else if (error) {
        console.log("Error (other than missing table):", error.message);
    } else {
        console.log("Table 'activities' exists or was just accessible.");
    }
}

runSQL();
