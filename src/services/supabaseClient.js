import { createClient } from "@supabase/supabase-js";

// The publishable key (sb_publishable_…) is safe to ship in the browser:
// row level security in the database decides what each user can do.
// Never put a secret key (sb_secret_…) in this app.
const DEFAULT_SUPABASE_URL = "https://zmzbhjenkiaonpqbyddj.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_DNoA7CVAh_GnAGSIe5AhQw_cML9X1JH";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
