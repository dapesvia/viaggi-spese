import { createClient } from '@supabase/supabase-js';

// Change these to your project details or use environment variables
// These are not sensitive as they are exposed in the frontend client anyway (Anon key)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vostro-url.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function pingSupabase() {
    console.log('Pinging Supabase to keep project active...');

    try {
        const { data, error } = await supabase.from('trips').select('id').limit(1);

        if (error) {
            console.error('Error querying Supabase:', error);
            process.exit(1);
        }

        console.log('Success! Supabase is active.');
        console.log(`Found ${data.length} trips (query test).`);
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

pingSupabase();
