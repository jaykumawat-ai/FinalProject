import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import api from "../api/api";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TripMap({ tripId }) {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState([15.3004543, 74.0855134]); // fallback
  const [radius, setRadius] = useState(5); // km
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tripId) {
      setError("Missing trip id");
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await api.get("discover/nearby", {
          params: {
            trip_id: tripId,
            radius: radius,
          },
        });

        const data = res.data;

        if (data?.places?.length > 0) {
          setPlaces(data.places);
          setCenter([data.center.lat, data.center.lon]);
          setError("");
        } else {
          setPlaces([]);
          setError("No places found in this radius");
        }
      } catch (err) {
        console.error("Map fetch error:", err);
        setError("Failed to load nearby places");
      } finally {
        setLoading(false);
      }
    }, 400); // debounce (safe for Overpass)

    return () => clearTimeout(timeout);
  }, [tripId, radius]);

  if (loading) return <p>Loading nearby places…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      {/* Radius Slider */}
      <div className="mb-3">
        <label className="text-sm font-medium">
          Radius: {radius} km
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "500px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup>
          {places.map((p, i) => (
            <Marker key={i} position={[p.lat, p.lon]}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                Type: {p.type}
                <br />
                Distance: {p.distance_km} km
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
