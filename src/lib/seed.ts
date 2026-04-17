import { supabase } from "@/integrations/supabase/client";

const SEED_FLAG = "merucampushub.seeded.v1";

const SEED_USER_EMAIL = "demo@merucampushub.local";
const SEED_USER_PASSWORD = "DemoMUST!2025seed";

const SAMPLES = [
  { type: "marketplace", title: "HP EliteBook 840 G5 — Excellent condition", description: "Intel Core i5 8th Gen, 8GB RAM, 256GB SSD. Battery health 90%. Comes with charger. Used for 1 year by a final-year student.", price: 32000, category: "Laptops", location: "Near MUST main gate", contact_phone: "+254712345601" },
  { type: "marketplace", title: "iPhone 11 64GB — Black", description: "Original, no scratches, battery 87%. Box and charger included. Reason for selling: upgrading.", price: 28500, category: "Phones & Accessories", location: "MUST Hostel D", contact_phone: "+254712345602" },
  { type: "marketplace", title: "Study desk + chair set", description: "Wooden study desk with drawer and matching chair. Perfect for hostel room. Pickup only.", price: 4500, category: "Furniture", location: "Kithoka", contact_phone: "+254712345603" },
  { type: "marketplace", title: "Ramtons 2-burner gas cooker", description: "Used for 6 months. Works perfectly. Includes 6kg gas cylinder (full).", price: 5800, category: "Household Goods", location: "Gitimene", contact_phone: "+254712345604" },
  { type: "service", title: "Affordable braids & dreadlocks", description: "I do box braids, knotless braids, twists and locs maintenance. I come to your hostel. Quality guaranteed.", price: 800, category: "Beauty & Hair", location: "MUST Hostel B (mobile)", contact_phone: "+254712345605" },
  { type: "service", title: "Calculus & Physics tutoring", description: "4th year BSc Physics student. I tutor 1st & 2nd years in Calculus I/II, Mechanics, Electricity. Per hour rate. WhatsApp me.", price: 300, category: "Academic Tutoring", location: "MUST Library area", contact_phone: "+254712345606" },
  { type: "rental", title: "Single room with own bathroom", description: "Self-contained single room, water + electricity included. 5 min walk from MUST main gate. Available now.", price: 4500, category: "Self-Contained", location: "Gitimene, near MUST", contact_phone: "+254712345607" },
  { type: "rental", title: "Bedsitter near MUST gate", description: "Spacious bedsitter with kitchen area. Tiled, modern bathroom. WiFi-ready building. Deposit 1 month.", price: 6000, category: "Single Room", location: "Kithoka, 3 min from gate", contact_phone: "+254712345608" },
];

export async function ensureSeedData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;

  const { count } = await supabase.from("listings").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }

  // Create / sign in demo user (seeds owned by them)
  let demoUserId: string | null = null;
  const { data: signIn } = await supabase.auth.signInWithPassword({ email: SEED_USER_EMAIL, password: SEED_USER_PASSWORD });
  if (signIn?.user) demoUserId = signIn.user.id;
  else {
    const { data: signUp } = await supabase.auth.signUp({
      email: SEED_USER_EMAIL,
      password: SEED_USER_PASSWORD,
      options: { data: { name: "MeruCampusHub Demo", phone: "+254712345600" } },
    });
    demoUserId = signUp?.user?.id ?? null;
  }

  if (!demoUserId) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }

  // Insert samples while signed in as demo
  const rows = SAMPLES.map((s) => ({ ...s, user_id: demoUserId!, photos: [] as string[], type: s.type as "marketplace" | "service" | "rental" }));
  await supabase.from("listings").insert(rows);

  // Sign out the seed user so app behaves normally
  await supabase.auth.signOut();
  localStorage.setItem(SEED_FLAG, "1");
  // Force reload so AuthProvider sees signed-out state
  window.location.reload();
}
