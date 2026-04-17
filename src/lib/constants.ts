export type ListingType = "marketplace" | "service" | "rental-info";

export const TYPE_LABELS: Record<ListingType, string> = {
  marketplace: "Marketplace",
  service: "Services",
  "rental-info": "Housing",
};

export const CATEGORIES: Record<ListingType, string[]> = {
  marketplace: [
    "Electronics",
    "Phones & Accessories",
    "Laptops & Computers",
    "Household Goods & Furniture",
    "Clothing & Shoes",
    "Books & Stationery",
    "Other",
  ],
  service: [
    "Beauty & Hair (nails, braiding, barber)",
    "Academic Tutoring",
    "Laundry & Cleaning",
    "Phone/Laptop Repairs",
    "Food Delivery/Snacks",
    "Photography & Printing",
    "Other",
  ],
  "rental-info": [
    "Single Room",
    "Bedsitter",
    "One Bedroom",
    "Self-Contained",
    "Shared Room",
    "Other",
  ],
};

export const RENTAL_AMENITIES = ["Water", "Electricity", "Security", "WiFi", "Parking", "Furnished"];

export const INTERESTS = [
  { id: "marketplace", label: "Marketplace items" },
  { id: "service", label: "Services" },
  { id: "rental-info", label: "Rentals / Housing info" },
  { id: "school", label: "School updates" },
];

export const HELP_CONTACT = {
  email: "merucampushub@gmail.com",
  phone: "+254745706087",
  whatsapp: "+254745706087",
};

export const SCHOOL_LINKS = [
  { label: "MUST Official Website", url: "https://www.must.ac.ke/" },
  { label: "MUST Student Portal", url: "https://studentportal.must.ac.ke/" },
  { label: "MUST eLearning", url: "https://elearning.must.ac.ke/" },
  { label: "MUST Library", url: "https://library.must.ac.ke/" },
];

export const formatKsh = (price: number | null | undefined) => {
  if (price === null || price === undefined) return "Contact for price";
  return `KSh ${Number(price).toLocaleString("en-KE")}`;
};

export const timeAgo = (dateStr: string) => {
  const d = new Date(dateStr).getTime();
  const diff = Math.max(0, Date.now() - d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export const waLink = (phone: string, title: string) => {
  const clean = phone.replace(/[^\d+]/g, "");
  return `https://wa.me/${clean.replace(/^\+/, "")}?text=${encodeURIComponent(
    `Hi, I saw your "${title}" on MeruCampusHub. Is it still available? I'm a MUST student.`
  )}`;
};

export const BUYER_PRECAUTION =
  "All transactions are one-on-one with the seller. Meet in safe public places near campus. No online money sending — deal at your own risk.";
