// src/pages/ExploreMap.jsx
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api/api";

// animate map when center changes
function MapFlyTo({ center, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, { animate: true, duration: 0.8 });
  }, [center, map, zoom]);
  return null;
}

const ALL_CATEGORIES = ["restaurant", "cafe", "attraction", "historic"];

export default function ExploreMap() {
  const [city, setCity] = useState("");
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [places, setPlaces] = useState([]);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(ALL_CATEGORIES);

  const mapRef = useRef(null);

  // --- City search (Nominatim)
  const handleSearchCity = async () => {
    if (!city) return;

    try {
      setLoading(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      const data = await res.json();

      if (!data || data.length === 0) {
        alert("City not found");
        return;
      }

      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);
      const newCenter = [lat, lon];

      setCenter(newCenter);
      await fetchNearby(lat, lon, radius);

    } catch (err) {
      console.error("City search failed", err);
      alert("City lookup failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch places from backend
  async function fetchNearby(lat, lon, r) {
    try {
      const res = await api.get("/discover/nearby", {
        params: {
          lat,
          lon,
          radius: r,
          category: categories.join(",")
        },
      });

      const results = res.data?.places || [];
      setPlaces(results);

    } catch (err) {
      console.error("Failed to load nearby places", err);
      setPlaces([]);
    }
  }

  const handleSearchThisArea = async () => {
    await fetchNearby(center[0], center[1], radius);
  };

  // --- Category toggle
  const toggleCategory = (cat) => {
    setCategories((prev) => {
      if (prev.length === ALL_CATEGORIES.length) return [cat];
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      return [...prev, cat];
    });
  };

  const selectAll = () => setCategories(ALL_CATEGORIES);

  // default marker fix
  const DefaultIcon = L.icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png",
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <div className="bg-white shadow px-6 py-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">Global Explore 🌍</h1>

        <input
          placeholder="Search city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border px-3 py-2 rounded w-72 ml-6"
        />

        <button
          onClick={handleSearchCity}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Search
        </button>

        <div className="ml-auto text-sm text-gray-500">
          Discover places anywhere
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white p-4 shadow-sm flex items-center gap-6 flex-wrap">

        <div>
          <label className="text-sm block">Radius: {radius} km</label>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleSearchThisArea}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          🔍 Search this area
        </button>

        {/* Category Filters */}
        <div className="flex gap-2 ml-6">
          <button
            onClick={selectAll}
            className={`px-3 py-1 rounded ${
              categories.length === ALL_CATEGORIES.length
                ? "bg-green-700 text-white"
                : "border"
            }`}
          >
            All
          </button>

          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded border ${
                categories.includes(cat) &&
                categories.length !== ALL_CATEGORIES.length
                  ? "bg-green-600 text-white"
                  : ""
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm">
          {loading ? "Loading…" : `${places.length} places`}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => (mapRef.current = map)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <MapFlyTo center={center} zoom={12} />

          <MarkerClusterGroup chunkedLoading>
            {places.map((p, i) => {
              const lat = Number(p.lat);
              const lon = Number(p.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

              return (
                <Marker key={`${p.name ?? i}-${lat}-${lon}`} position={[lat, lon]}>
                  <Popup>
                    <strong>{p.name}</strong>
                    <div className="text-xs text-gray-600">{p.type}</div>
                    <div className="text-xs">
                      Distance: {p.distance_km ?? "—"} km
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
