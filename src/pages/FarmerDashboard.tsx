import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getCategoryEmoji, freshnessLabel } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Plus, Package, ClipboardList, LogOut, Check, X, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?role=farmer");
    }
  }, [loading, user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setDataLoading(true);
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").eq("farmer_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("farmer_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setProducts(productsRes.data || []);
    setOrders(ordersRes.data || []);
    setDataLoading(false);
  };

  const handleOrderAction = async (orderId: string, status: "accepted" | "rejected") => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    toast.success(`Order ${status}`);
    fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast.success("Product removed");
    fetchData();
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-hero-gradient text-primary-foreground px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">नमस्ते 🙏</p>
            <h1 className="text-xl font-bold">{profile.name}</h1>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/farmer/edit-profile")}>
              <UserCog className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-foreground/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{products.length}</p>
            <p className="text-xs opacity-80">Products</p>
          </div>
          <div className="bg-primary-foreground/15 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{orders.filter(o => o.status === "pending").length}</p>
            <p className="text-xs opacity-80">Pending Orders</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 mt-4">
        {[
          { key: "products" as const, label: "My Products", icon: Package },
          { key: "orders" as const, label: "Orders", icon: ClipboardList },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${tab === key ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">
        {dataLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

        {tab === "products" && !dataLoading && (
          <>
            {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products yet. Add your first product!</p>}
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="text-3xl">{getCategoryEmoji(p.category)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.quantity} {p.unit} • {formatPrice(p.price)}/{p.unit}</p>
                  <p className={`text-xs ${freshnessLabel(p.harvest_date).color}`}>{freshnessLabel(p.harvest_date).label}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="text-primary" onClick={() => navigate(`/product/${p.id}`)}>
                    <Package className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </>
        )}

        {tab === "orders" && !dataLoading && (
          <>
            {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No orders yet.</p>}
            {orders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{o.product_name}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    o.status === "pending" ? "bg-secondary/20 text-secondary" :
                    o.status === "accepted" ? "bg-primary/20 text-primary" :
                    o.status === "rejected" ? "bg-destructive/20 text-destructive" :
                    "bg-accent text-accent-foreground"
                  }`}>{o.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">Buyer: {o.buyer_name} • {o.quantity} units • {formatPrice(o.total_price)}</p>
                {o.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-hero-gradient text-primary-foreground rounded-lg gap-1 flex-1" onClick={() => handleOrderAction(o.id, "accepted")}>
                      <Check className="w-4 h-4" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg gap-1 flex-1 border-destructive text-destructive" onClick={() => handleOrderAction(o.id, "rejected")}>
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </>
        )}
      </div>

      <button onClick={() => navigate("/farmer/add-product")} className="fixed bottom-6 right-6 w-14 h-14 bg-hero-gradient text-primary-foreground rounded-2xl shadow-glow flex items-center justify-center hover:scale-105 transition-transform">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FarmerDashboard;
