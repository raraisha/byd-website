import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://qbixwpmyirbydopzxxwe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiaXh3cG15aXJieWRvcHp4eHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTIwOTEsImV4cCI6MjA3NDE4ODA5MX0.Yj4B-mI4DVei-abKV96Es6aW2sqX2jWntSdUuwmdsGo"; // boleh dipotong biar gak bocor di publik

export const supabase = createClient(supabaseUrl, supabaseKey);
// kode di atas jangan diubah atau dihapus