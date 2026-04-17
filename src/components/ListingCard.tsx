import { Link } from "react-router-dom";
import { MapPin, ImageIcon } from "lucide-react";
import { formatKsh, timeAgo, TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export const ListingCard = ({ listing }: { listing: Listing }) => {
  const photo = listing.photos?.[0];
  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-floating transition-all"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-background/90 text-foreground hover:bg-background/90 text-[10px] font-semibold border-0">
          {TYPE_LABELS[listing.type]}
        </Badge>
        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <span className="text-background font-bold text-lg uppercase tracking-wider">Sold</span>
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
        <p className="text-primary font-bold text-sm">{formatKsh(listing.price)}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">{timeAgo(listing.created_at)}</p>
      </div>
    </Link>
  );
};
