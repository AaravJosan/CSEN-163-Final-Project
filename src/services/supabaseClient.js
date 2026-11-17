import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://zmzbhjenkiaonpqbyddj.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "sb_publishable_DNoA7CVAh_GnAGSIe5AhQw_cML9X1JH";


const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
