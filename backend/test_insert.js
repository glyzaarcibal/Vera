import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function testInsert() {
    console.log("Testing insert into pending_users...");
    const sampleUser = {
        email: `test_${Date.now()}@example.com`,
        password: "Password123!",
        user_metadata: { name: "Test User", birthday: "1990-01-01", contact_number: "12345678" },
        token: "123456",
        created_at: new Date()
    };

    const { data, error } = await supabase
        .from('pending_users')
        .insert([sampleUser]);

    if (error) {
        console.error("Insert error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Insert success:", data);
    }
}

testInsert();
