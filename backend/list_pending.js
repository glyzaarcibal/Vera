import supabaseAdmin from "./utils/supabase.utils.js";

async function listPendingUsers() {
    try {
        const { data, error } = await supabaseAdmin
            .from("pending_users")
            .select("*");

        if (error) {
            console.error("Error fetching pending users:", error);
        } else {
            console.log("Pending Users:", data);
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

listPendingUsers();
