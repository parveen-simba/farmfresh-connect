import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getCategoryEmoji, freshnessLabel } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut, MapPin, ClipboardList, Map } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["all", "vegetables", "fruits", "grains", "dairy", "spices"];

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  const [products, setProducts] = useState<any[]>([]);
  
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?role=buyer");
    }
  }, [loading, user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setDataLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data || []);
    setDataLoading(false);
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.farmer_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="bg-warm-gradient text-secondary-foreground px-4 pt-6 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Hello 👋</p>
            <h1 className="text-xl font-bold">{profile.name}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary-foreground/10" onClick={() => navigate("/map")} title="Map view">
              <Map className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary-foreground/10" onClick={() => navigate("/orders")}>
              <ClipboardList className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary-foreground/10" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search products or farmers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-12 rounded-xl bg-background text-foreground border-0" />
        </div>
      </div>

      {dataLoading ? (
        <p className="text-center text-muted-foreground py-12">Loading...</p>
      ) : (
        <>
          <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                {c === "all" ? "🛒 All" : `${getCategoryEmoji(c)} ${c.charAt(0).toUpperCase() + c.slice(1)}`}
              </button>
            ))}
          </div>
          <div className="px-4 mt-4 grid grid-cols-2 gap-3">
            {filtered.map((p, i) => {
              const freshness = freshnessLabel(p.harvest_date);
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => navigate(`/product/${p.id}`)} className="bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center text-4xl">{getCategoryEmoji(p.category)}</div>
                  )}
                  <div className="p-3">
                  <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                  {p.name_hi && <p className="text-xs text-muted-foreground">{p.name_hi}</p>}
                  <p className="text-lg font-bold text-primary mt-1">{formatPrice(p.price)}<span className="text-xs text-muted-foreground font-normal">/{p.unit}</span></p>
                  <p className={`text-xs mt-1 ${freshness.color}`}>{freshness.label}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{p.location_address || "India"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">by {p.farmer_name}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No products found</p>}
        </>
      )}
    </div>
  );
};

export default Marketplace;
