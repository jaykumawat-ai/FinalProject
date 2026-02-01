// src/components/TripMap.jsx
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";

import api from "../api/api";
import { savePlaceToTrip, getTripPlaces } from "../api/places";
import "leaflet/dist/leaflet.css";

/* ================= HELPERS ================= */

function getStoredCenter(tripId) {
  try {
    const raw = localStorage.getItem(`trip:${tripId}:center`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeCenter(tripId, center) {
  try {
    localStorage.setItem(`trip:${tripId}:center`, JSON.stringify(center));
  } catch {}
}

function normalizeType(type = "") {
  const t = String(type).toLowerCase();
  if (t.includes("restaurant")) return "restaurant";
  if (t.includes("cafe")) return "cafe";
  if (t.includes("historic")) return "historic";
  if (t.includes("attraction") || t.includes("tourism")) return "attraction";
  return "other";
}

// Haversine distance (km)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ================= ICON ================= */

const savedIcon = new L.Icon({
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

/* ================= MAP HELPERS ================= */

function MapTracker({ onMove }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMove([c.lat, c.lng]);
    },
  });
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center);
  }, [center, map]);
  return null;
}

/* ================= COMPONENT ================= */

const ALL_CATEGORIES = ["restaurant", "cafe", "attraction", "historic"];

export default function TripMap({ tripId }) {
  const [places, setPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);

  // start from stored center if available (keeps map where user last viewed this trip)
  const [center, setCenter] = useState(() => getStoredCenter(tripId));
  const [mapCenter, setMapCenter] = useState(null);

  const [radius, setRadius] = useState(5);
  const [categories, setCategories] = useState(ALL_CATEGORIES);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showSavedPanel, setShowSavedPanel] = useState(false);

  const savedIds = useRef(new Set());
  const lastGoodPlacesRef = useRef([]);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);

  // map instance ref
  const mapRef = useRef(null);

  // ================= Travel Mode / Notifications =================
  const [travelMode, setTravelMode] = useState(false);
  const [notifyCategories, setNotifyCategories] = useState([
    "restaurant",
    "cafe",
    "attraction",
  ]);
  const alertedRef = useRef(new Set());
  const [nearbyAlert, setNearbyAlert] = useState(null);

  /* ================= FETCH NEARBY (SAFE) ================= */
  const loadPlaces = useCallback(
    async ({ overrideLat, overrideLon } = {}) => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setLoading(true);
      setError("");
      const thisRequestId = ++requestIdRef.current;

      try {
        const params = {
          radius,
          category: categories.join(","),
        };

        if (overrideLat != null && overrideLon != null) {
          params.lat = overrideLat;
          params.lon = overrideLon;
        } else {
          params.trip_id = tripId;
        }

        const res = await api.get("/discover/nearby", { params });
        if (thisRequestId !== requestIdRef.current) return;

        const data = res.data || {};
        const results = data.places || [];

        if (results.length > 0) {
          setPlaces(results);
          lastGoodPlacesRef.current = results;
        } else {
          // fallback to last good places to avoid 0-results jitter
          setPlaces(lastGoodPlacesRef.current);
        }

        // set initial center only if user hasn't stored one for this trip
        if (!getStoredCenter(tripId) && data.center?.lat && data.center?.lon) {
          const initial = [data.center.lat, data.center.lon];
          setCenter(initial);
          storeCenter(tripId, initial);
        }
      } catch (err) {
        console.error("loadPlaces failed:", err);
        setError(err?.response?.data?.detail || "Failed to load places");
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [tripId, radius, categories]
  );

  // load when core deps change
  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  /* ================= Smart radius rules (removed forced auto-adjust) ================= */
  // (removed automatic shrinking/expanding to keep radius user-controlled)

  /* ================= LOAD SAVED ================= */
  useEffect(() => {
    let mounted = true;
    async function loadSaved() {
      try {
        const data = await getTripPlaces(tripId);
        if (!mounted) return;
        setSavedPlaces(data);
        savedIds.current = new Set(data.map((p) => p.name));
      } catch (err) {
        console.error("failed to load saved places", err);
      }
    }
    loadSaved();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  /* ================= GPS ================= */
useEffect(() => {
  if (!navigator.geolocation) return;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      setUserLocation([pos.coords.latitude, pos.coords.longitude]);
    },
    (err) => {
      console.warn("GPS error", err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, []);
  /* ================= Travel Mode notification effect ================= */
  useEffect(() => {
    if (!travelMode) return;
    if (!userLocation || !places.length) return;

    // look for nearest not-yet-alerted place within ~0.6 km (600m)
    for (const p of places) {
      const type = normalizeType(p.type);

      if (!notifyCategories.includes(type)) continue;
      if (savedIds.current.has(p.name)) continue;
      if (alertedRef.current.has(p.name)) continue;

      const distance = getDistanceKm(
        userLocation[0],
        userLocation[1],
        p.lat,
        p.lon
      );

      if (distance <= 0.6) {
        alertedRef.current.add(p.name);
        setNearbyAlert({ ...p, distance: distance.toFixed(2) });
        break;
      }
    }
  }, [travelMode, userLocation, places, notifyCategories]);

  /* ================= HANDLERS ================= */

  const handleAllClick = () => setCategories(ALL_CATEGORIES);

  const handleCategoryClick = (cat) => {
    setCategories((prev) =>
      prev.length === ALL_CATEGORIES.length
        ? [cat]
        : prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const onSearchArea = async () => {
    if (!mapCenter || inFlightRef.current) return;
    await loadPlaces({ overrideLat: mapCenter[0], overrideLon: mapCenter[1] });
  };

  const onSavePlace = async () => {
    if (!selectedPlace) return;
    setSaving(true);
    try {
      await savePlaceToTrip(tripId, selectedPlace);
      const updated = await getTripPlaces(tripId);
      setSavedPlaces(updated);
      savedIds.current = new Set(updated.map((p) => p.name));
    } catch (err) {
      console.error("savePlace failed", err);
    } finally {
      setSaving(false);
    }
  };

  /* ================= Prevent duplicates & zoom logic ================= */

  const filteredPlaces = places.filter((p) => !savedIds.current.has(p.name));

  const zoomByRadius = (() => {
    if (radius <= 3) return 15;
    if (radius <= 6) return 14;
    if (radius <= 10) return 13;
    return 12;
  })();

  /* ================= UI: helpers for actions ================= */

  function flyToLocation(lat, lon, zoom = 15) {
    if (!mapRef.current) return;
    try {
      mapRef.current.invalidateSize();
    } catch {
      /* ignore */
    }
    mapRef.current.flyTo([lat, lon], zoom, { animate: true, duration: 0.8 });
  }

  function openGoogleDirections(destLat, destLon) {
    const origin =
      userLocation && userLocation.length === 2
        ? `${userLocation[0]},${userLocation[1]}`
        : "";
    const destination = `${destLat},${destLon}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank");
  }

  /* ================= RENDER ================= */

  return (
    <div className="flex w-full h-[calc(100vh-120px)]">
      {/* LEFT: controls + map */}
      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* Controls container */}
        <div className="bg-white p-3 rounded shadow-sm space-y-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={handleAllClick}
              className={`px-3 py-1 rounded ${
                categories.length === ALL_CATEGORIES.length
                  ? "bg-green-700 text-white"
                  : "border"
              }`}
            >
              All
            </button>

            {ALL_CATEGORIES.filter((cat) =>
              places.some((p) => normalizeType(p.type) === cat)
            ).map((c) => (
              <button
                key={c}
                onClick={() => handleCategoryClick(c)}
                className={`px-3 py-1 rounded border ${
                  categories.includes(c) &&
                  categories.length !== ALL_CATEGORIES.length
                    ? "bg-green-600 text-white"
                    : ""
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}

            <button
              onClick={() => setShowSavedPanel(true)}
              className="ml-auto px-3 py-1 border rounded bg-white hover:bg-gray-50"
            >
              📍 Saved Places ({savedPlaces.length})
            </button>
          </div>

          {/* Travel Mode + notification category toggles */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Travel Mode</span>

            <button
              onClick={() => setTravelMode((v) => !v)}
              className={`w-12 h-6 rounded-full relative transition ${
                travelMode ? "bg-pink-500" : "bg-gray-300"
              }`}
              title="Toggle Travel Mode notifications"
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                  travelMode ? "right-1" : "left-1"
                }`}
              />
            </button>

            <span className="text-xs text-gray-500">{travelMode ? "ON" : "OFF"}</span>
          </div>

          {travelMode && (
            <div className="flex gap-2 mt-2">
              {["restaurant", "cafe", "attraction"].map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setNotifyCategories((prev) =>
                      prev.includes(cat)
                        ? prev.filter((c) => c !== cat)
                        : [...prev, cat]
                    )
                  }
                  className={`px-2 py-1 text-xs rounded border ${
                    notifyCategories.includes(cat) ? "bg-green-600 text-white" : ""
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Radius + search */}
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm">Radius: {radius} km</label>
              <input
                type="range"
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </div>

            <button
              disabled={inFlightRef.current || loading}
              onClick={onSearchArea}
              className={`px-4 py-1 rounded ${
                inFlightRef.current || loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 text-white"
              }`}
            >
              {inFlightRef.current || loading ? "Searching…" : "🔍 Search this area"}
            </button>

            <div className="ml-auto text-sm">
              {loading ? "Loading…" : `${places.length} places`}
            </div>
          </div>
        </div>

        {/* MAP container */}
        <div className="flex-1 relative">
          {center ? (
            <MapContainer
              center={center}
              zoom={zoomByRadius}
              whenCreated={(map) => {
                mapRef.current = map;
              }}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

              <MapTracker
                onMove={(c) => {
                  setMapCenter(c);
                  // Persist last viewed center so refreshing returns to same view
                  storeCenter(tripId, c);
                }}
              />

              <RecenterMap center={center} />

              {userLocation && (
                <CircleMarker center={userLocation} radius={8} color="blue">
                  <Popup>You are here</Popup>
                </CircleMarker>
              )}

              <MarkerClusterGroup>
                {savedPlaces.map((p, i) => (
                  <Marker key={`saved-${i}`} position={[p.lat, p.lon]} icon={savedIcon}>
                    <Popup>
                      <strong>{p.name}</strong>
                      <br />
                      Saved • {p.distance_km} km
                    </Popup>
                  </Marker>
                ))}

                {filteredPlaces.map((p, i) => (
                  <Marker
                    key={`nearby-${i}`}
                    position={[p.lat, p.lon]}
                    eventHandlers={{ click: () => setSelectedPlace(p) }}
                  >
                    <Popup>
                      <strong>{p.name}</strong>
                      <br />
                      {normalizeType(p.type)} • {p.distance_km} km
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading map…
            </div>
          )}

          {/* Floating locate button */}
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              zIndex: 999,
            }}
          >
            <button
              onClick={() => {
                if (!mapRef.current) return;
                if (userLocation) {
                  flyToLocation(userLocation[0], userLocation[1], 15);
                } else {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const lat = pos.coords.latitude;
                      const lon = pos.coords.longitude;
                      setUserLocation([lat, lon]);
                      flyToLocation(lat, lon, 15);
                    },
                    () => {
                      /* ignore */
                    }
                  );
                }
              }}
              title="Go to my location"
              className="bg-white px-3 py-2 rounded shadow-sm border hover:bg-gray-50"
            >
              📍
            </button>
          </div>
        </div>

        {/* PLACE details — single, corrected block */}
        {selectedPlace && (
          <div className="bg-white p-4 rounded-lg shadow-md border">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold pr-4">{selectedPlace.name}</h3>

              <button
                onClick={() => setSelectedPlace(null)}
                className="flex items-center justify-center h-8 w-8 rounded-full
                           border border-gray-300 text-gray-500
                           hover:bg-red-500 hover:text-white transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Meta */}
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                {normalizeType(selectedPlace.type)}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">{selectedPlace.distance_km} km</p>

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={onSavePlace}
                disabled={saving || savedIds.current.has(selectedPlace.name)}
                className={`flex-1 py-2 rounded font-medium ${
                  savedIds.current.has(selectedPlace.name)
                    ? "bg-green-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {savedIds.current.has(selectedPlace.name)
                  ? "Saved ✓"
                  : saving
                  ? "Saving…"
                  : "Save to Trip"}
              </button>

              <button
                onClick={() => openGoogleDirections(selectedPlace.lat, selectedPlace.lon)}
                className="flex-1 border rounded py-2 hover:bg-gray-50"
              >
                🌍 Open in Google Maps
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Saved places collapsible panel */}
      {showSavedPanel && (
        <div className="w-80 border-l bg-white shadow-xl overflow-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Saved Places ({savedPlaces.length})</h3>
            <button onClick={() => setShowSavedPanel(false)}>Close</button>
          </div>

          <div className="p-4 space-y-2">
            {savedPlaces.length === 0 ? (
              <p className="text-sm text-gray-500">No saved places</p>
            ) : (
              savedPlaces.map((p, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const lat = Number(p.lat);
                    const lon = Number(p.lon);
                    if (!mapRef.current || Number.isNaN(lat) || Number.isNaN(lon)) {
                      console.warn("Map not ready or invalid coords");
                      return;
                    }

                    // close panel and focus map
                    setShowSavedPanel(false);

                    setTimeout(() => {
                      try {
                        mapRef.current.invalidateSize();
                      } catch (err) {
                        /* ignore */
                      }
                      mapRef.current.flyTo([lat, lon], 15, { animate: true, duration: 0.8 });

                      setTimeout(() => {
                        L.popup({ autoClose: true })
                          .setLatLng([lat, lon])
                          .setContent(`<strong>${p.name}</strong><br/>Saved • ${p.distance_km} km`)
                          .openOn(mapRef.current);
                      }, 350);
                    }, 120);
                  }}
                  className="border p-2 rounded cursor-pointer hover:bg-green-50"
                >
                  <strong>{p.name}</strong>
                  <div className="text-sm text-gray-600">
                    {p.type} • {p.distance_km} km
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Nearby alert popup */}
      {nearbyAlert && (
        <div style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1200 }}>
          <div className="bg-white border shadow-lg rounded p-4 w-72">
            <strong className="block mb-1">📍 Nearby Place</strong>
            <div className="text-sm font-medium">{nearbyAlert.name}</div>
            <div className="text-xs text-gray-600">
              {normalizeType(nearbyAlert.type)} • {nearbyAlert.distance} km
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  flyToLocation(nearbyAlert.lat, nearbyAlert.lon);
                  setNearbyAlert(null);
                }}
                className="flex-1 bg-green-600 text-white py-1 rounded text-sm"
              >
                View
              </button>

              <button
                onClick={() => setNearbyAlert(null)}
                className="flex-1 border py-1 rounded text-sm"
              >
                Ignore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* error notice */}
      {error && (
        <div style={{ position: "fixed", left: 12, bottom: 12, zIndex: 1200 }}>
          <div className="bg-red-100 text-red-800 px-3 py-2 rounded">{error}</div>
        </div>
      )}
    </div>
  );
}
