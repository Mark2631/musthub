import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ImagePlus, X, ShoppingBag, Wrench, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, ListingType } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

const TYPE_CHOICES: { v: ListingType; label: string; icon: any; color: string }[] = [
  { v: "marketplace", label: "Marketplace", icon: ShoppingBag, color: "from-emerald-500 to-green-600" },
  { v: "service", label: "Service", icon: Wrench, color: "from-amber-500 to-orange-600" },
  { v: "rental", label: "Rental", icon: HomeIcon, color: "from-sky-500 to-blue-600" },
];

const schema = z.object({
  type: z.enum(["marketplace", "service", "rental"]),
  title: z.string().trim().min(3, "Title too short").max(120),
  description: z.string().trim().min(10, "Add a description (min 10 chars)").max(2000),
  price: z.number().nonnegative().nullable(),
  category: z.string().min(1, "Pick a category"),
  location: z.string().trim().min(2, "Add a location").max(120),
  contact_phone: z.string().trim().min(7, "Valid phone required").max(20),
});

export default function PostListing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<ListingType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Near MUST main gate");
  const [phone, setPhone] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("phone").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.phone) setPhone(data.phone);
    });
  }, [user]);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).slice(0, 5 - files.length);
    setFiles((f) => [...f, ...list]);
    setPreviews((p) => [...p, ...list.map((f) => URL.createObjectURL(f))]);
  };
  const removeFile = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const submit = async () => {
    if (!user || !type) return;
    const parsed = schema.safeParse({
      type, title, description,
      price: type === "service" && !price ? null : price ? Number(price) : null,
      category, location, contact_phone: phone,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const photoUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file);
        if (upErr) throw upErr;
        const { data: { publicUrl } } = supabase.storage.from("listing-photos").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
      const { data, error } = await supabase
        .from("listings")
        .insert([{
          type,
          title,
          description,
          price: type === "service" && !price ? null : price ? Number(price) : null,
          category,
          location,
          contact_phone: phone,
          photos: photoUrls,
          user_id: user.id,
        }])
        .select()
        .single();
      if (error) throw error;
      toast.success("Listed! 🎉");
      nav(`/listing/${data.id}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="px-4 pt-5 pb-3 bg-card border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <button onClick={() => (step === 2 ? setStep(1) : nav(-1))} className="p-1 -ml-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">Post a listing</h1>
        <span className="ml-auto text-xs text-muted-foreground">Step {step}/2</span>
      </header>

      {step === 1 && (
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">What are you posting?</p>
          {TYPE_CHOICES.map(({ v, label, icon: Icon, color }) => (
            <button
              key={v}
              onClick={() => { setType(v); setCategory(""); setStep(2); }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl bg-card shadow-card text-left transition-all",
                "hover:shadow-floating active:scale-[0.99]",
                type === v && "ring-2 ring-primary"
              )}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-bold">{label}</div>
                <div className="text-xs text-muted-foreground">
                  {v === "marketplace" && "Sell items: phones, laptops, furniture..."}
                  {v === "service" && "Offer skills: tutoring, hair, repairs..."}
                  {v === "rental" && "List a room or house near campus"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && type && (
        <div className="p-5 space-y-4">
          <div>
            <Label htmlFor="t">Title *</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HP EliteBook 840 G5" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="d">Description *</Label>
            <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Condition, features, why you're selling..." maxLength={2000} />
          </div>
          <div>
            <Label htmlFor="cat">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES[type].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="pr">Price (KSh) {type === "service" && <span className="text-muted-foreground text-xs">(optional)</span>}</Label>
            <Input id="pr" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Photos (up to 5)</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removeFile(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-foreground/70 text-background flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px]">Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
                </label>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="loc">Location *</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Near MUST main gate" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="ph">Contact phone *</Label>
            <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" maxLength={20} />
          </div>
          <Button onClick={submit} disabled={submitting} variant="hero" size="xl" className="w-full">
            {submitting ? "Posting..." : "Post listing"}
          </Button>
        </div>
      )}
    </div>
  );
}
