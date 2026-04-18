import { supabase } from "@/integrations/supabase/client";

const SEED_FLAG = "merucampushub.seeded.v3";

/**
 * Seeds demo listings safely via a server-side SECURITY DEFINER function.
 * - Requires the user to be signed in (uses their auth.uid)
 * - DB function is a no-op if there are already 5+ listings
 * - Never logs the user out, never swaps sessions
 */
export async function ensureSeedData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // only seed for authenticated users; safe no-op otherwise

  const { count } = await supabase.from("listings").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= 5) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }

  const { error } = await supabase.rpc("seed_demo_listings" as any);
  if (!error) localStorage.setItem(SEED_FLAG, "1");
}
