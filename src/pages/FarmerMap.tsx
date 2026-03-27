import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Locate, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice, getCategoryEmoji, freshnessLabel } from "@/lib/helpers";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const farmerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface FarmerWithProducts {
  farmer_id: string;
  farmer_name: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  products: {
    id: string;
    name: string;
    price: number;
    unit: string;
    category: string;
    harvest_date: string;
    quantity: number;
  }[];
}

function RecenterButton() {
  const map = useMap();
  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13 });
  };
  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-6 right-4 z-[1000] w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-accent transition-colors"
      title="My Location"
    >
      <Locate className="w-5 h-5" />
    </button>
  );
}

const FarmerMap = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?role=buyer");
  }, [loading, user]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*");
      setProducts(data || []);
      setDataLoading(false);
    };
    fetchProducts();
  }, []);

  const farmers = useMemo<FarmerWithProducts[]>(() => {
    const map = new Map<string, FarmerWithProducts>();
    // Default coordinates around major Indian agricultural regions
    const defaultLocations: [number, number][] = [
      [28.6139, 77.2090], // Delhi
      [19.0760, 72.8777], // Mumbai  
      [12.9716, 77.5946], // Bangalore
      [22.5726, 88.3639], // Kolkata
      [26.9124, 75.7873], // Jaipur
    ];
    let locIndex = 0;
    for (const p of products) {
      const lat = p.location_lat || defaultLocations[locIndex % defaultLocations.length][0] + (Math.random() - 0.5) * 0.5;
      const lng = p.location_lng || defaultLocations[locIndex % defaultLocations.length][1] + (Math.random() - 0.5) * 0.5;
      if (!map.has(p.farmer_id)) {
        locIndex++;
        map.set(p.farmer_id, {
          farmer_id: p.farmer_id,
          farmer_name: p.farmer_name,
          location_lat: lat,
          location_lng: lng,
          location_address: p.location_address || "",
          products: [],
        });
      }
      map.get(p.farmer_id)!.products.push({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        category: p.category,
        harvest_date: p.harvest_date,
        quantity: p.quantity,
      });
    }
    return Array.from(map.values());
  }, [products]);

  // Default center: India
  const center: [number, number] = useMemo(() => {
    if (farmers.length > 0) {
      const avgLat = farmers.reduce((s, f) => s + f.location_lat, 0) / farmers.length;
      const avgLng = farmers.reduce((s, f) => s + f.location_lng, 0) / farmers.length;
      return [avgLat, avgLng];
    }
    return [20.5937, 78.9629]; // center of India
  }, [farmers]);

  if (loading) return null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border z-[1001] relative">
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-2 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-lg font-bold text-foreground">🗺️ Nearby Farmers</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/marketplace")}
          title="List view"
        >
          <List className="w-5 h-5" />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {dataLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading map…</p>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={farmers.length > 0 ? 10 : 5}
            scrollWheelZoom
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterButton />

            {farmers.map((f) => (
              <Marker key={f.farmer_id} position={[f.location_lat, f.location_lng]} icon={farmerIcon}>
                <Popup maxWidth={280} minWidth={200}>
                  <div className="font-sans">
                    <p className="font-bold text-base mb-0.5">{f.farmer_name}</p>
                    {f.location_address && (
                      <p className="text-xs text-gray-500 mb-2">{f.location_address}</p>
                    )}
                    <p className="text-xs font-semibold text-gray-600 mb-1">
                      {f.products.length} product{f.products.length !== 1 ? "s" : ""} available:
                    </p>
                    <ul className="list-none p-0 m-0 space-y-1">
                      {f.products.slice(0, 5).map((prod) => {
                        const fresh = freshnessLabel(prod.harvest_date);
                        return (
                          <li key={prod.id}>
                            <button
                              onClick={() => navigate(`/product/${prod.id}`)}
                              className="w-full text-left p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <span className="text-sm">
                                {getCategoryEmoji(prod.category)} {prod.name}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {formatPrice(prod.price)}/{prod.unit} · {prod.quantity} {prod.unit} · {fresh.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {f.products.length > 5 && (
                      <p className="text-xs text-gray-400 mt-1">+{f.products.length - 5} more</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default FarmerMap;
