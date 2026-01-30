import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import api from "../api/api";
import "leaflet/dist/leaflet.css";

/* ✅ ADD THIS FUNCTION HERE */
function normalizeType(type) {
  if (!type) return "other";
  if (type === "restaurant") return "restaurant";
  if (type === "cafe") return "cafe";
  if (type === "attraction" || type === "historic") return "attraction";
  return "other";
}

export default function TripMap({ tripId }) {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState([15.3, 74.08]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlaces() {
      try {
        const res = await api.get("/discover/nearby", {
          params: { trip_id: tripId },
        });

        setPlaces(res.data.places);
        setCenter([res.data.center.lat, res.data.center.lon]);
      } catch (err) {
        console.error(err);
        setError("Failed to load nearby places");
      }
    }

    loadPlaces();
  }, [tripId]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <MapContainer center={center} zoom={13} style={{ height: "500px" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MarkerClusterGroup>
        {places.map((p, i) => {
          const normalizedType = normalizeType(p.type); // ✅ USE IT HERE

          return (
            <Marker key={i} position={[p.lat, p.lon]}>
              <Popup>
                <strong>{p.name}</strong><br />
                Type: {normalizedType}<br />
                Distance: {p.distance_km} km
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
