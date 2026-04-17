export type ListingType = "marketplace" | "service" | "rental";

export const TYPE_LABELS: Record<ListingType, string> = {
  marketplace: "Marketplace",
  service: "Services",
  rental: "Rentals",
};

export const CATEGORIES: Record<ListingType, string[]> = {
  marketplace: [
    "Electronics",
    "Phones & Accessories",
    "Laptops",
    "Household Goods",
    "Furniture",
    "Clothing",
    "Other",
  ],
  service: [
    "Beauty & Hair",
    "Academic Tutoring",
    "Laundry & Cleaning",
    "Repairs & Maintenance",
    "Photography",
    "Food Delivery",
    "Other",
  ],
  rental: [
    "Single Room",
    "One Bedroom",
    "Two Bedroom",
    "Self-Contained",
    "Other",
  ],
};

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
    `Hi, I'm interested in your "${title}" at MUST`
  )}`;
};
