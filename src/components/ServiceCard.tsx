import { Link } from "react-router-dom";
import { MapPin, Wrench, PlayCircle, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatKsh, timeAgo } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

/**
 * Richer, media-forward card for the Services tab.
 * Larger media area, video badge, and prominent category chip.
 */
export const ServiceCard = ({ listing }: { listing: Listing }) => {
  const photo = listing.photos?.[0];
  const hasVideo = (listing.videos?.length ?? 0) > 0;
  const video = listing.videos?.[0];

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block bg-card rounded-3xl overflow-hidden border border-border shadow-card hover:shadow-floating hover:-translate-y-0.5 transition-all"
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {video ? (
          <video
            src={video}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        ) : photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/50">
            <Wrench className="w-12 h-12" />
          </div>
        )}
        <Badge className="absolute top-3 left-3 bg-warning text-warning-foreground hover:bg-warning border-0 text-[10px] font-bold uppercase tracking-wider shadow-soft">
          Service
        </Badge>
        {hasVideo && (
          <div className="absolute top-3 right-3 bg-foreground/80 backdrop-blur text-background rounded-full px-2 py-1 text-[10px] font-semibold flex items-center gap-1">
            <PlayCircle className="w-3 h-3" /> Video
          </div>
        )}
        {(listing.photos?.length ?? 0) > 1 && (
          <div className="absolute bottom-3 right-3 bg-foreground/80 text-background rounded-full px-2 py-1 text-[10px] font-semibold flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {listing.photos.length}
          </div>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <Badge variant="secondary" className="text-[10px] font-medium">{listing.category}</Badge>
        <h3 className="font-bold text-sm line-clamp-2 leading-snug">{listing.title}</h3>
        <p className="text-primary font-extrabold">{formatKsh(listing.price)}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{listing.location}</span>
          <span className="flex-shrink-0">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
};
