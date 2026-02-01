const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Admin client for server-side operations (uses service role key)
let supabaseAdmin = null;
if (env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

module.exports = {
  supabase,
  supabaseAdmin
};
