import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import api from "../api/api";
import "leaflet/dist/leaflet.css";

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
        {places.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lon]}>
            <Popup>
              <strong>{p.name}</strong><br />
              {p.type}<br />
              {p.distance_km} km
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
