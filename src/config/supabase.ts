import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";

/**
 * Standard Supabase client initialized with the anonymous key.
 * Used for standard backend-driven Supabase operations.
 */
export const supabase: SupabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

/**
 * Administrative Supabase client initialized with the service role key.
 * IMPORTANT: This client has full database/auth administrative privileges.
 * NEVER expose the service role key or this client instance to the frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper to verify that Supabase configuration credentials are set.
 */
export const verifySupabaseConfig = (): boolean => {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
};
