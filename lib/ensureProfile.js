import { supabase } from "./supabaseClient";

export async function ensureProfile(user) {
  if (!user) return;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    await supabase.from("profiles").insert({
      id: user.id,
      display_name: user.email?.split("@")[0] || "user",
    });
  }
}
