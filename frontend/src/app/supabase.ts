import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vwvwsixgvnukjtbgyfgn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dndzaXhndm51a2p0Ymd5ZmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjI2MTEsImV4cCI6MjA5MTgzODYxMX0.ryNPKufbXw4d99_iHJ7m00aPwPttuZPVAoUT0oVI4wk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);