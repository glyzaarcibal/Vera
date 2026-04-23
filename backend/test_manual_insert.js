import supabaseAdmin from "./utils/supabase.utils.js";

async function testInsert() {
    const code = "123456";
    const user = {
        email: "test_manual_" + Date.now() + "@gmail.com",
        password: "Password123!",
        username: "Manual Test",
        contactNumber: "09123456789",
        birthDate: "2000-01-01"
    };

    console.log("Testing manual insert into pending_users...");
    
    const { data, error } = await supabaseAdmin
        .from('pending_users')
        .insert([{
            email: user.email,
            password: user.password,
            user_metadata: {
                name: user.username,
                contact_number: user.contactNumber,
                birthday: user.birthDate
            },
            token: code,
            created_at: new Date()
        }])
        .select();

    if (error) {
        console.error("Insert Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Insert Success:", data);
    }
}

testInsert();
