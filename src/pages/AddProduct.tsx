import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, X } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "vegetables", label: "🥬 Vegetables" },
  { value: "fruits", label: "🍎 Fruits" },
  { value: "grains", label: "🌾 Grains" },
  { value: "dairy", label: "🥛 Dairy" },
  { value: "spices", label: "🌶️ Spices" },
  { value: "other", label: "📦 Other" },
] as const;

const AddProduct = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState<string>("vegetables");
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?role=farmer");
    }
  }, [loading, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !quantity || !user || !profile) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);

    let image_url: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });
      if (uploadError) {
        toast.error("Image upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("products").insert({
      farmer_id: user.id,
      farmer_name: profile.name,
      name,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      harvest_date: harvestDate,
      location_lat: profile.location_lat,
      location_lng: profile.location_lng,
      location_address: profile.location_address || "India",
      category,
      image_url,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product added! ✅");
    navigate("/farmer");
  };

  if (loading || !profile) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <button onClick={() => navigate("/farmer")} className="flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">Add Product</h1>
      <p className="text-muted-foreground text-sm mb-6">उत्पाद जोड़ें</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Product Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-36 rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to add photo</span>
              <span className="text-xs">फ़ोटो जोड़ें</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Product Name / उत्पाद का नाम *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes" className="h-12 rounded-xl" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={`py-3 rounded-xl text-sm font-medium transition-all ${category === c.value ? "bg-accent text-accent-foreground ring-2 ring-primary" : "bg-card text-muted-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Price (₹) *</label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="₹20" className="h-12 rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Quantity *</label>
            <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="50" className="h-12 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Unit</label>
            <div className="flex gap-2">
              {["kg", "litre", "dozen", "piece"].map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${unit === u ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Harvest Date</label>
            <Input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="h-12 rounded-xl" />
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-14 rounded-xl text-base font-semibold bg-hero-gradient text-primary-foreground shadow-glow mt-4">
          {submitting ? "Adding..." : "Add Product ✅"}
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
