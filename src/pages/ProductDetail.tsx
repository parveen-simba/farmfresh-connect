import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, getCurrentUser, createOrder, getReviewsForFarmer, addReview, getAverageRating } from "@/lib/store";
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
  const user = getCurrentUser();
  const product = getProductById(id || "");
  const [qty, setQty] = useState("1");
  const [showQR, setShowQR] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [, setRefresh] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const freshness = freshnessLabel(product.harvestDate);
  const reviews = getReviewsForFarmer(product.farmerId);
  const avgRating = getAverageRating(product.farmerId);
  const isBuyer = user?.role === "buyer";

  const handleOrder = () => {
    if (!user) { navigate("/auth?role=buyer"); return; }
    const q = Number(qty);
    if (q <= 0 || q > product.quantity) {
      toast.error("Invalid quantity");
      return;
    }
    createOrder({
      productId: product.id,
      productName: product.name,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      buyerId: user.id,
      buyerName: user.name,
      quantity: q,
      totalPrice: q * product.price,
    });
    toast.success("Order placed! 🎉");
    navigate(user.role === "buyer" ? "/marketplace" : "/farmer");
  };

  const handleReview = () => {
    if (!user || !reviewText.trim()) return;
    addReview({
      farmerId: product.farmerId,
      buyerId: user.id,
      buyerName: user.name,
      rating: reviewRating,
      comment: reviewText,
    });
    setReviewText("");
    toast.success("Review posted!");
    setRefresh((r) => r + 1);
  };

  const qrData = JSON.stringify({
    product: product.name,
    farmer: product.farmerName,
    location: product.location.address,
    harvestDate: product.harvestDate,
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
        {/* Product header */}
        <div className="bg-card rounded-2xl p-6 shadow-sm text-center mb-4">
          <div className="text-6xl mb-3">{getCategoryEmoji(product.category)}</div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          {product.nameHi && <p className="text-muted-foreground">{product.nameHi}</p>}
          <p className="text-3xl font-extrabold text-primary mt-2">{formatPrice(product.price)}<span className="text-base text-muted-foreground font-normal">/{product.unit}</span></p>
          <p className={`text-sm mt-2 ${freshness.color}`}>{freshness.label}</p>
        </div>

        {/* Details */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-lg">👨‍🌾</div>
            <div>
              <p className="font-semibold text-foreground">{product.farmerName}</p>
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
            <p className="text-sm text-muted-foreground">{product.location.address}</p>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Available: {product.quantity} {product.unit}</span>
            <span>Harvested: {new Date(product.harvestDate).toLocaleDateString("en-IN")}</span>
          </div>
        </div>

        {/* QR Code */}
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

        {/* Order */}
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

        {/* Reviews */}
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
          {reviews.map((r) => (
            <div key={r.id} className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm">{r.buyerName}</p>
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
