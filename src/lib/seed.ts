import { supabase } from "@/integrations/supabase/client";

const SEED_FLAG = "merucampushub.seeded.v2";

const SEED_USER_EMAIL = "demo@merucampushub.local";
const SEED_USER_PASSWORD = "DemoMUST!2025seed";

const SAMPLES = [
  { type: "marketplace", title: "HP EliteBook 840 G5 — Excellent condition", description: "Intel Core i5 8th Gen, 8GB RAM, 256GB SSD. Battery 90%. Comes with charger.", price: 32000, negotiable: true, category: "Laptops & Computers", location: "Near MUST main gate", contact_phone: "+254712345601" },
  { type: "marketplace", title: "iPhone 11 64GB — Black", description: "Original, no scratches, battery 87%. Box and charger included.", price: 28500, negotiable: true, category: "Phones & Accessories", location: "MUST Hostel D", contact_phone: "+254712345602" },
  { type: "marketplace", title: "Single mattress 4x6 — clean", description: "Used 1 semester, very clean. Selling because graduating.", price: 1500, negotiable: false, category: "Household Goods & Furniture", location: "Kithoka", contact_phone: "+254712345603" },
  { type: "marketplace", title: "Ramtons 2-burner gas cooker", description: "Used 6 months. Includes 6kg gas cylinder.", price: 5800, negotiable: true, category: "Household Goods & Furniture", location: "Gitimene", contact_phone: "+254712345604" },
  { type: "service", title: "Affordable braids & dreadlocks", description: "Box braids, knotless braids, twists, locs maintenance. I come to your hostel.", price: 500, negotiable: true, category: "Beauty & Hair (nails, braiding, barber)", location: "MUST Hostel B (mobile)", contact_phone: "+254712345605" },
  { type: "service", title: "Calculus & Physics tutoring", description: "4th year BSc Physics student. Tutoring 1st & 2nd years. Per hour rate.", price: 300, negotiable: false, category: "Academic Tutoring", location: "MUST Library area", contact_phone: "+254712345606" },
  { type: "service", title: "Phone & laptop screen repairs", description: "iPhone, Samsung, Tecno, HP, Lenovo. Same-day service. Genuine parts.", price: null, negotiable: true, category: "Phone/Laptop Repairs", location: "Nchiru shopping centre", contact_phone: "+254712345610" },
  { type: "rental-info", title: "Single self-contained room — own bathroom", description: "Water + electricity included. 5 min walk from MUST main gate. Available now.", price: 4000, negotiable: false, category: "Self-Contained", location: "Gitimene, near MUST", contact_phone: "+254712345607" },
  { type: "rental-info", title: "Bedsitter near MUST gate", description: "Spacious bedsitter, kitchen area, modern bathroom. WiFi-ready building.", price: 6000, negotiable: true, category: "Bedsitter", location: "Kithoka, 3 min from gate", contact_phone: "+254712345608" },
  { type: "rental-info", title: "One bedroom, fully fenced", description: "Secure compound, parking, water tank backup. Couples / serious students preferred.", price: 9500, negotiable: false, category: "One Bedroom", location: "Nchiru, 10 min walk to MUST", contact_phone: "+254712345611" },
];

export async function ensureSeedData() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;

  const { count } = await supabase.from("listings").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= SAMPLES.length) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }

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

  // Mark demo user as onboarded so they don't get redirected if they sign in
  await supabase.from("profiles").update({ onboarded: true, is_verified_seller: true }).eq("user_id", demoUserId);

  const rows = SAMPLES.map((s) => ({
    ...s,
    user_id: demoUserId!,
    photos: [] as string[],
    type: s.type as any,
  }));
  await supabase.from("listings").insert(rows);

  await supabase.auth.signOut();
  localStorage.setItem(SEED_FLAG, "1");
  window.location.reload();
}
