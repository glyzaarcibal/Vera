import supabaseAdmin from "./utils/supabase.utils.js";

async function getTableInfo() {
    try {
        const { data, error } = await supabaseAdmin.rpc('get_table_info', { table_name: 'pending_users' });
        if (error) {
            console.error("RPC Error (get_table_info might not exist):", error);
            // Fallback: try to see if we can get it from information_schema
            const { data: schemaData, error: schemaError } = await supabaseAdmin
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_name', 'pending_users');
            
            if (schemaError) {
                console.error("Error fetching from information_schema:", schemaError);
            } else {
                console.log("Columns Info:", schemaData);
            }
        } else {
            console.log("Table Info:", data);
        }
    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

getTableInfo();
