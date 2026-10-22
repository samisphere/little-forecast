const SUPABASE_URL = "https://cfsmjkfwbucelkrgmxpt.supabase.co/";
const SUPABASE_ANON_KEY = "sb_publishable_gMnbenhB8su5I6aL5qxUrg_yZAlPbU6";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

console.log("Supabase client initialized:", !!supabaseClient);

async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("weather_records")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase database error:", error.message);
    return;
  }

  console.log("Supabase database connected successfully!", data);
}

testSupabaseConnection();
