import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, addProduct } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
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
  const user = getCurrentUser();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState<string>("vegetables");
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);

  if (!user || user.role !== "farmer") {
    navigate("/auth?role=farmer");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !quantity) {
      toast.error("Please fill all required fields");
      return;
    }
    addProduct({
      farmerId: user.id,
      farmerName: user.name,
      name,
      price: Number(price),
      quantity: Number(quantity),
      unit,
      image: "",
      harvestDate,
      location: user.location || { lat: 28.6139, lng: 77.209, address: "Delhi" },
      category: category as any,
    });
    toast.success("Product added! ✅");
    navigate("/farmer");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <button onClick={() => navigate("/farmer")} className="flex items-center gap-2 text-muted-foreground mb-6">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">Add Product</h1>
      <p className="text-muted-foreground text-sm mb-6">उत्पाद जोड़ें</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Product Name / उत्पाद का नाम *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tomatoes" className="h-12 rounded-xl" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${category === c.value ? "bg-accent text-accent-foreground ring-2 ring-primary" : "bg-card text-muted-foreground"}`}
              >
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

        <Button type="submit" className="w-full h-14 rounded-xl text-base font-semibold bg-hero-gradient text-primary-foreground shadow-glow mt-4">
          Add Product ✅
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
