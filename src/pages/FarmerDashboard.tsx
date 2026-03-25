import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProductsByFarmer, getOrdersByFarmer, updateOrderStatus, deleteProduct, logout } from "@/lib/store";
import { formatPrice, getCategoryEmoji, freshnessLabel } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Plus, Package, ClipboardList, LogOut, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [, setRefresh] = useState(0);

  if (!user || user.role !== "farmer") {
    navigate("/auth?role=farmer");
    return null;
  }

  const products = getProductsByFarmer(user.id);
  const orders = getOrdersByFarmer(user.id);

  const handleOrderAction = (orderId: string, status: "accepted" | "rejected") => {
    updateOrderStatus(orderId, status);
    toast.success(`Order ${status}`);
    setRefresh((r) => r + 1);
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    toast.success("Product removed");
    setRefresh((r) => r + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-hero-gradient text-primary-foreground px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">नमस्ते 🙏</p>
            <h1 className="text-xl font-bold">{user.name}</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="w-5 h-5" />
          </Button>
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

      {/* Tabs */}
      <div className="flex gap-2 px-4 mt-4">
        {[
          { key: "products" as const, label: "My Products", icon: Package },
          { key: "orders" as const, label: "Orders", icon: ClipboardList },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${tab === key ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-3">
        {tab === "products" && (
          <>
            {products.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No products yet. Add your first product!</p>
            )}
            {products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="text-3xl">{getCategoryEmoji(p.category)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.quantity} {p.unit} • {formatPrice(p.price)}/{p.unit}</p>
                  <p className={`text-xs ${freshnessLabel(p.harvestDate).color}`}>{freshnessLabel(p.harvestDate).label}</p>
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

        {tab === "orders" && (
          <>
            {orders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No orders yet.</p>
            )}
            {orders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{o.productName}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    o.status === "pending" ? "bg-secondary/20 text-secondary" :
                    o.status === "accepted" ? "bg-primary/20 text-primary" :
                    o.status === "rejected" ? "bg-destructive/20 text-destructive" :
                    "bg-accent text-accent-foreground"
                  }`}>{o.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">Buyer: {o.buyerName} • {o.quantity} units • {formatPrice(o.totalPrice)}</p>
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

      {/* FAB */}
      <button
        onClick={() => navigate("/farmer/add-product")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-hero-gradient text-primary-foreground rounded-2xl shadow-glow flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FarmerDashboard;
