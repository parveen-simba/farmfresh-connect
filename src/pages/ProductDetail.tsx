import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, getCategoryEmoji, freshnessLabel } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Star, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qty, setQty] = useState("1");
  const [showQR, setShowQR] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const [prodRes, revRes] = await Promise.all([
      supabase.from("products").select("*").eq("id", id!).single(),
      supabase.from("reviews").select("*").eq("farmer_id", "placeholder").order("created_at", { ascending: false }),
    ]);
    if (prodRes.data) {
      setProduct(prodRes.data);
      // Now fetch reviews for this farmer
      const { data: revData } = await supabase.from("reviews").select("*").eq("farmer_id", prodRes.data.farmer_id).order("created_at", { ascending: false });
      setReviews(revData || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Product not found</p></div>;

  const freshness = freshnessLabel(product.harvest_date);
  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;
  const isBuyer = profile?.role === "buyer";

  const handleOrder = async () => {
    if (!user || !profile) { navigate("/auth?role=buyer"); return; }
    const q = Number(qty);
    if (q <= 0 || q > product.quantity) { toast.error("Invalid quantity"); return; }
    const { error } = await supabase.from("orders").insert({
      product_id: product.id,
      product_name: product.name,
      farmer_id: product.farmer_id,
      farmer_name: product.farmer_name,
      buyer_id: user.id,
      buyer_name: profile.name,
      quantity: q,
      total_price: q * product.price,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Order placed! 🎉");
    navigate("/marketplace");
  };

  const handleReview = async () => {
    if (!user || !profile || !reviewText.trim()) return;
    const { error } = await supabase.from("reviews").insert({
      farmer_id: product.farmer_id,
      buyer_id: user.id,
      buyer_name: profile.name,
      rating: reviewRating,
      comment: reviewText,
    });
    if (error) { toast.error(error.message); return; }
    setReviewText("");
    toast.success("Review posted!");
    fetchProduct();
  };

  const qrData = JSON.stringify({
    product: product.name,
    farmer: product.farmer_name,
    location: product.location_address,
    harvestDate: product.harvest_date,
    price: `₹${product.price}/${product.unit}`,
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="px-4">
        <div className="bg-card rounded-2xl p-6 shadow-sm text-center mb-4">
          <div className="text-6xl mb-3">{getCategoryEmoji(product.category)}</div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          {product.name_hi && <p className="text-muted-foreground">{product.name_hi}</p>}
          <p className="text-3xl font-extrabold text-primary mt-2">{formatPrice(product.price)}<span className="text-base text-muted-foreground font-normal">/{product.unit}</span></p>
          <p className={`text-sm mt-2 ${freshness.color}`}>{freshness.label}</p>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-lg">👨‍🌾</div>
            <div>
              <p className="font-semibold text-foreground">{product.farmer_name}</p>
              <div className="flex items-center gap-1">
                {avgRating > 0 && (
                  <>
                    <Star className="w-3 h-3 text-secondary fill-secondary" />
                    <span className="text-xs text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-accent-foreground" /></div>
            <p className="text-sm text-muted-foreground">{product.location_address || "India"}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Available: {product.quantity} {product.unit}</span>
            <span>Harvested: {new Date(product.harvest_date).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        <button onClick={() => setShowQR(!showQR)} className="w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3 mb-4">
          <QrCode className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">Product Traceability QR</span>
        </button>
        {showQR && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-card rounded-2xl p-6 shadow-sm flex flex-col items-center mb-4">
            <QRCodeSVG value={qrData} size={180} bgColor="transparent" fgColor="hsl(142, 50%, 32%)" />
            <p className="text-xs text-muted-foreground mt-3 text-center">Scan to view farm-to-table journey</p>
          </motion.div>
        )}

        {isBuyer && (
          <div className="bg-card rounded-2xl p-4 shadow-sm mb-4">
            <label className="text-sm font-medium text-foreground mb-2 block">Order Quantity ({product.unit})</label>
            <div className="flex gap-3">
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min={1} max={product.quantity} className="h-12 rounded-xl flex-1" />
              <Button onClick={handleOrder} className="h-12 px-6 bg-warm-gradient text-secondary-foreground rounded-xl font-semibold">
                Order {formatPrice(Number(qty) * product.price)}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">Reviews</h3>
          {isBuyer && (
            <div className="mb-4 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star className={`w-5 h-5 ${s <= reviewRating ? "text-secondary fill-secondary" : "text-muted"}`} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write a review..." className="h-10 rounded-lg flex-1" />
                <Button size="sm" onClick={handleReview} className="bg-primary text-primary-foreground rounded-lg">Post</Button>
              </div>
            </div>
          )}
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet</p>}
          {reviews.map((r: any) => (
            <div key={r.id} className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm">{r.buyer_name}</p>
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-secondary fill-secondary" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetail;
