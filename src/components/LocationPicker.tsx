import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPicker = ({ lat, lng, onLocationChange }: LocationPickerProps) => {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : null
  );
  const [detecting, setDetecting] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    const address = await reverseGeocode(lat, lng);
    onLocationChange(lat, lng, address);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        const address = await reverseGeocode(latitude, longitude);
        onLocationChange(latitude, longitude, address);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true }
    );
  };

  const center: [number, number] = position || [20.5937, 78.9629];
  const zoom = position ? 13 : 5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> Farm Location
        </label>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          {detecting ? "Detecting…" : "📍 Use my location"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Tap the map to set your farm location</p>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 250 }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          key={`${center[0]}-${center[1]}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationChange={handleMapClick} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      {position && (
        <p className="text-xs text-muted-foreground">
          📌 {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
