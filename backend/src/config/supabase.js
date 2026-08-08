require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

if (!supabaseAnonKey) {
  console.warn('SUPABASE_ANON_KEY not set - RLS-respecting client will fall back to service key, which bypasses RLS.');
}

// Admin client - service role key, bypasses RLS.
// Use for: creating users (signup), verifying tokens (auth middleware).
const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Regular client - anon key, respects RLS.
// Use for: normal DB reads/writes tied to a logged-in user.
const supabaseService = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = {
  supabaseAuth,
  supabaseService,
};
