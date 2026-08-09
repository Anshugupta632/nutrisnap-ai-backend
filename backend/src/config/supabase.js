require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

// Admin/service client - service role key, bypasses RLS.
// Used for: admin.createUser, token verification (getUser), and DB writes needing RLS bypass.
// IMPORTANT: never call .auth.signInWithPassword / .auth.signOut / .auth.refreshSession
// on this client - it is a shared singleton across all requests, and those calls
// would mutate its session state, silently downgrading it for other in-flight requests.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Factory - creates a brand new throwaway client for user-auth flows
// (login, signup auto-login, refresh, logout). A fresh client per call means
// signInWithPassword etc. can never pollute the shared admin client's state.
function createAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

module.exports = {
  supabaseAuth: supabaseAdmin,
  supabaseService: supabaseAdmin,
  createAuthClient,
};
