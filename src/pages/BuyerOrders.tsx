import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/helpers";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "bg-secondary/15 text-secondary border-secondary/20" },
  accepted: { label: "Accepted", icon: CheckCircle, className: "bg-primary/15 text-primary border-primary/20" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/20" },
  delivered: { label: "Delivered", icon: Truck, className: "bg-accent text-accent-foreground border-accent" },
};

const BuyerOrders = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) navigate("/auth?role=buyer");
  }, [loading, user]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  // Realtime subscription for order status changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("buyer-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
          if (updated.status === "accepted") {
            toast.success(`Order "${updated.product_name}" accepted! 🎉`);
          } else if (updated.status === "rejected") {
            toast.error(`Order "${updated.product_name}" was rejected`);
          } else if (updated.status === "delivered") {
            toast.success(`Order "${updated.product_name}" delivered! 📦`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) => [payload.new as any, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user!.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setDataLoading(false);
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const filters = ["all", "pending", "accepted", "rejected", "delivered"];

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-warm-gradient text-secondary-foreground px-4 pt-6 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/marketplace")} className="text-secondary-foreground/80">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">My Orders</h1>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-secondary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs opacity-80">Total</p>
          </div>
          <div className="bg-secondary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === "pending").length}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
          <div className="bg-secondary-foreground/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{orders.filter((o) => o.status === "accepted").length}</p>
            <p className="text-xs opacity-80">Accepted</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="px-4 mt-4 space-y-3">
        {dataLoading && (
          <p className="text-center text-muted-foreground py-12">Loading orders...</p>
        )}

        {!dataLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </p>
            <button
              onClick={() => navigate("/marketplace")}
              className="mt-3 text-sm text-primary font-semibold hover:underline"
            >
              Browse marketplace →
            </button>
          </div>
        )}

        {!dataLoading &&
          filtered.map((o, i) => {
            const config = statusConfig[o.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const date = new Date(o.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-xl p-4 shadow-sm border border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{o.product_name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      from {o.farmer_name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${config.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{o.quantity} units</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(o.total_price)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
};

export default BuyerOrders;
