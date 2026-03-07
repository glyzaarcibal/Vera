import supabaseAdmin from "./utils/supabase.utils.js";

async function listProfiles() {
    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("username")
            .limit(5);

        if (error) {
            console.error("Error fetching profiles:", error);
        } else {
            console.log("Profiles:", data);
        }

        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) {
            console.error("Error listing users:", userError);
        } else {
            console.log("Users (first 5):", users.users.slice(0, 5).map(u => u.email));
        }

    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

listProfiles();
