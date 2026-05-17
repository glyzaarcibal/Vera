
import supabaseAdmin from '../utils/supabase.utils.js';

async function checkDb() {
    try {
        const { data, error } = await supabaseAdmin.from('user_resources').select('*').limit(5);
        if (error) throw error;
        console.log('User Resources sample:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('DB check failed:', e.message);
    }
}

checkDb();
