import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import LocationPicker from "@/components/LocationPicker";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?role=farmer");
  }, [loading, user]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setLat(profile.location_lat);
      setLng(profile.location_lng);
      setAddress(profile.location_address || "");
    }
  }, [profile]);

  const handleLocationChange = (newLat: number, newLng: number, newAddress: string) => {
    setLat(newLat);
    setLng(newLng);
    setAddress(newAddress);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone,
        location_lat: lat,
        location_lng: lng,
        location_address: address,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated! 🎉");
      await refreshProfile();
      navigate(-1);
    }
    setSubmitting(false);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
      </div>

      <form onSubmit={handleSave} className="p-4 space-y-5 max-w-lg mx-auto">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Phone</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            className="h-12 rounded-xl"
            type="tel"
          />
        </div>

        <LocationPicker lat={lat} lng={lng} onLocationChange={handleLocationChange} />

        {address && (
          <p className="text-sm text-muted-foreground">📍 {address}</p>
        )}

        <Button
          type="submit"
          disabled={submitting || !name.trim()}
          className="w-full h-12 rounded-xl bg-hero-gradient text-primary-foreground font-semibold"
        >
          {submitting ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
};

export default EditProfile;
