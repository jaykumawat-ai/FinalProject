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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

import api from "../api/api";
import { savePlaceToTrip, getTripPlaces } from "../api/places";
import "leaflet/dist/leaflet.css";

/* ================= HELPERS ================= */

function getStoredCenter(tripId) {
  try {
    const raw = localStorage.getItem(`trip:${tripId}:center`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("getStoredCenter failed:", e);
    return null;
  }
}

function storeCenter(tripId, center) {
  try {
    localStorage.setItem(`trip:${tripId}:center`, JSON.stringify(center));
  } catch (e) {
    console.warn("storeCenter failed:", e);
  }
}

function normalizeType(type = "") {
  const t = String(type ?? "").toLowerCase();
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

/* ================= ICONS ================= */

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

function MapFlyTo({ center, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    map.flyTo(center, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [center, map, zoom]);

  return null;
}

/* ================= COMPONENT ================= */

const ALL_CATEGORIES = ["restaurant", "cafe", "attraction", "historic"];

export default function TripMap({
  tripId,
  mode = "trip", // 👈 ADD THIS
  externalCenter,
  externalRadius,
  externalCategories,
  externalTravelMode,
}) {
  const [places, setPlaces] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [tripDays, setTripDays] = useState(5);
  const isGlobal = mode === "explore";
  const [city, setCity] = useState("");

  // keep persistent center per trip if available
  const [center, setCenter] = useState(
    () => externalCenter ?? getStoredCenter(tripId),
  );

  useEffect(() => {
    if (externalCenter) {
      setCenter(externalCenter);
    }
  }, [externalCenter]);

  const [mapCenter, setMapCenter] = useState(null);

  const [radius, setRadius] = useState(externalRadius ?? 5);

  useEffect(() => {
    if (externalRadius != null) setRadius(externalRadius);
  }, [externalRadius]);
  const [categories, setCategories] = useState(
    externalCategories ?? ALL_CATEGORIES,
  );
  useEffect(() => {
    if (externalCategories) setCategories(externalCategories);
  }, [externalCategories]);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // refs for stable control of concurrent requests
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);

  // map instance ref
  const mapRef = useRef(null);

  // Travel Mode / Notifications
  const [travelMode, setTravelMode] = useState(externalTravelMode ?? false);
  useEffect(() => {
    if (externalTravelMode != null) setTravelMode(externalTravelMode);
  }, [externalTravelMode]);

  const [notifyCategories, setNotifyCategories] = useState([
    "restaurant",
    "cafe",
    "attraction",
  ]);
  const alertedRef = useRef(new Set());
  const [nearbyAlert, setNearbyAlert] = useState(null);

  // If this is a global map (no stored trip center),
  // set default India center
  useEffect(() => {
    if (!isGlobal) return;

    const defaultIndia = [22.9734, 78.6569];
    setCenter(defaultIndia);
  }, [isGlobal]);

  const handleSearchCity = async () => {
    if (!city) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`,
      );

      const data = await res.json();

      if (!data?.length) {
        alert("City not found");
        return;
      }

      const lat = Number(data[0].lat);
      const lon = Number(data[0].lon);

      setCenter([lat, lon]);

      // also reload nearby
      loadPlaces({ overrideLat: lat, overrideLon: lon });
    } catch {
      alert("City search failed");
    }
  };

  const onSaveExplorePlace = async () => {
    if (!selectedPlace) return;

    try {
      await api.post("/explore/save", {
        name: selectedPlace.name,
        lat: selectedPlace.lat,
        lon: selectedPlace.lon,
        type: selectedPlace.type,
      });

      alert("Saved to Explore!");
    } catch {
      alert("Failed to save");
    }
  };

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
        } else if (isGlobal && center) {
          params.lat = center[0];
          params.lon = center[1];
        } else if (!isGlobal) {
          params.trip_id = tripId;
        }

        const res = await api.get("/discover/nearby", { params });
        if (thisRequestId !== requestIdRef.current) return;

        const data = res.data || {};
        const results = data.places || [];

        if (results.length > 0) {
          setPlaces(results);
        } else {
          // fallback to last good places if any
          setPlaces((prev) => (prev.length ? prev : results));
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
    [tripId, radius, categories, isGlobal, center],
  );

  // Call loadPlaces when dependencies change (tripId, radius, categories)
  useEffect(() => {
    loadPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, radius, categories.join(",")]);

  /* ================= LOAD SAVED ================= */
  useEffect(() => {
    if (isGlobal) return; // 🚀 Skip saved places in global

    let mounted = true;
    async function loadSaved() {
      try {
        const data = await getTripPlaces(tripId);
        if (!mounted) return;
        setSavedPlaces(data || []);
      } catch (err) {
        console.error("failed to load saved places", err);
      }
    }
    loadSaved();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    if (isGlobal) return;

    async function loadTripMeta() {
      try {
        const res = await api.get(`/trips/summary/${tripId}`);
        if (res.data?.days) {
          setTripDays(res.data.days);
        }
      } catch {
        console.warn("Failed to load trip meta");
      }
    }

    loadTripMeta();
  }, [tripId]);

  /* ================= GPS: watchPosition for live updates ================= */
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
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* ================= Notification permission (one-time) ================= */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch((e) => {
        console.warn("Notification permission request failed:", e);
      });
    }
  }, []);

  /* ================= Travel Mode watcher (notifications + in-app alert) ================= */
  useEffect(() => {
    if (!travelMode || !userLocation || places.length === 0) return;

    for (const p of places) {
      const type = normalizeType(p.type);
      if (!notifyCategories.includes(type)) continue;
      if (savedPlaces.some((s) => s.name === p.name)) continue;
      if (alertedRef.current.has(p.name)) continue;

      const dist = getDistanceKm(
        userLocation[0],
        userLocation[1],
        p.lat,
        p.lon,
      );

      if (dist <= 0.5) {
        alertedRef.current.add(p.name);

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("📍 Nearby Place", {
              body: `${p.name} • ${dist.toFixed(2)} km`,
            });
          } catch (e) {
            console.warn("Notification creation failed:", e);
          }
        }

        // In-app popup: only provide "View in Google Maps" or "Ignore"
        setNearbyAlert({
          ...p,
          distance: dist.toFixed(2),
        });

        console.log("🔔 Notified:", p.name, dist);
      }
    }
  }, [userLocation, travelMode, places, notifyCategories, savedPlaces]);

  /* ================= HANDLERS ================= */

  const handleAllClick = () => setCategories(ALL_CATEGORIES);

  const handleCategoryClick = (cat) => {
    setCategories((prev) =>
      prev.length === ALL_CATEGORIES.length
        ? [cat]
        : prev.includes(cat)
          ? prev.filter((c) => c !== cat)
          : [...prev, cat],
    );
  };

  // explicit search current map area
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
      setSavedPlaces(updated || []);
    } catch (err) {
      console.error("savePlace failed", err);
    } finally {
      setSaving(false);
    }
  };

  // Remove saved place (calls backend delete endpoint).
  // Backend expected: DELETE /trips/{tripId}/places/{placeKey}
  const removeSavedPlace = async (place) => {
    if (!place || !place.name) {
      console.warn("removeSavedPlace: invalid place", place);
      return;
    }

    try {
      await api.delete(`/trips/${tripId}/places`, {
        params: { name: place.name },
      });

      const updated = await getTripPlaces(tripId);
      setSavedPlaces(updated || []);
    } catch (err) {
      console.error("Failed to remove saved place", err);
      setError("Failed to remove saved place");
    }
  };

  // Open Google Maps directions (origin optional)
  function openGoogleDirections(destLat, destLon) {
    const origin =
      userLocation && userLocation.length === 2
        ? `${userLocation[0]},${userLocation[1]}`
        : "";
    const destination = `${destLat},${destLon}`;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}`;
    if (origin) {
      url += `&origin=${encodeURIComponent(origin)}`;
    }
    window.open(url, "_blank");
  }

  /* ================= Prevent duplicates & zoom logic ================= */

  // derive saved names set from savedPlaces state
  const savedNames = useMemo(
    () => new Set((savedPlaces || []).map((p) => p.name)),
    [savedPlaces],
  );

  const filteredPlaces = useMemo(
    () => (places || []).filter((p) => !savedNames.has(p.name)),
    [places, savedNames],
  );

  const zoomByRadius = (() => {
    if (radius <= 3) return 15;
    if (radius <= 6) return 14;
    if (radius <= 10) return 13;
    if (radius <= 20) return 12;
    if (radius <= 35) return 11;
    return 10;
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

  /* ================= RENDER ================= */

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {isGlobal && (
        <div className="bg-white shadow px-6 py-4 flex items-center">
          <h1 className="text-2xl font-bold">Global Explore 🌍</h1>
          <div className="ml-auto text-sm text-gray-500">
            Discover places anywhere
          </div>
        </div>
      )}
      {/* LEFT: controls + map */}
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
        {/* Controls container */}
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
          {isGlobal && (
            <div className="flex gap-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Search city..."
                className="border px-3 py-2 rounded w-64"
              />
              <button
                onClick={handleSearchCity}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Search
              </button>
            </div>
          )}

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

            {/* ALWAYS show category buttons (don't depend on current places list) */}
            {ALL_CATEGORIES.map((c) => (
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

            {!isGlobal && (
              <button
                onClick={() => setShowSavedPanel(true)}
                className="ml-auto px-3 py-1 border rounded bg-white hover:bg-gray-50"
              >
                📍 Saved Places ({savedPlaces.length})
              </button>
            )}
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

            <span className="text-xs text-gray-500">
              {travelMode ? "ON" : "OFF"}
            </span>
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
                        : [...prev, cat],
                    )
                  }
                  className={`px-2 py-1 text-xs rounded border ${
                    notifyCategories.includes(cat)
                      ? "bg-green-600 text-white"
                      : ""
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
                max={isGlobal ? 50 : 20}
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
              {inFlightRef.current || loading
                ? "Searching…"
                : "🔍 Search this area"}
            </button>

            <div className="ml-auto text-sm">
              {loading ? "Loading…" : `${places.length} places`}
            </div>
          </div>
        </div>

        {/* MAP container */}
        <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden shadow-md">
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
                  if (!isGlobal && tripId) {
                    storeCenter(tripId, c);
                  }
                }}
              />

              <MapFlyTo center={center} zoom={zoomByRadius} />

              {userLocation && (
                <CircleMarker center={userLocation} radius={8} color="blue">
                  <Popup>You are here</Popup>
                </CircleMarker>
              )}

              <MarkerClusterGroup>
                {savedPlaces.map((p) => {
                  const key = `${p.id ?? p.place_id ?? p.name}-${p.lat}-${p.lon}`;
                  return (
                    <Marker
                      key={`saved-${key}`}
                      position={[p.lat, p.lon]}
                      icon={savedIcon}
                    >
                      <Popup>
                        <strong>{p.name}</strong>
                        <br />
                        Saved • {p.distance_km} km
                      </Popup>
                    </Marker>
                  );
                })}

                {filteredPlaces.map((p) => {
                  const key = `${p.id ?? p.place_id ?? p.name}-${p.lat}-${p.lon}`;
                  return (
                    <Marker
                      key={`nearby-${key}`}
                      position={[p.lat, p.lon]}
                      eventHandlers={{ click: () => setSelectedPlace(p) }}
                    >
                      <Popup>
                        <strong>{p.name}</strong>
                        <br />
                        {normalizeType(p.type)} • {p.distance_km} km
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading map…
            </div>
          )}

          {/* Floating locate button */}
          <div style={{ position: "absolute", left: 12, top: 12, zIndex: 999 }}>
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
                      /* ignore errors shown to user in console */
                    },
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

        {/* PLACE details — single */}
        {selectedPlace && (
          <div className="bg-white p-4 rounded-lg shadow-md border">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold pr-4">
                {selectedPlace.name}
              </h3>

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

            <p className="mt-2 text-sm text-gray-600">
              {selectedPlace.distance_km} km
            </p>

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              {isGlobal ? (
                <button
                  onClick={onSaveExplorePlace}
                  className="flex-1 py-2 rounded font-medium bg-green-600 text-white"
                >
                  Save Place
                </button>
              ) : (
                <button
                  onClick={onSavePlace}
                  disabled={saving || savedNames.has(selectedPlace.name)}
                  className="flex-1 py-2 rounded font-medium bg-green-600 text-white"
                >
                  {savedNames.has(selectedPlace.name)
                    ? "Saved ✓"
                    : saving
                      ? "Saving…"
                      : "Save to Trip"}
                </button>
              )}

              <button
                onClick={() => {
                  openGoogleDirections(selectedPlace.lat, selectedPlace.lon);
                }}
                className="flex-1 border rounded py-2 hover:bg-gray-50"
              >
                🌍 Open in Google Maps
              </button>
            </div>

            {/* 👇 ADD THIS RIGHT BELOW ACTIONS */}
            {!isGlobal && (
              <select
                onChange={async (e) => {
                  if (isGlobal) return;

                  const day = Number(e.target.value);
                  if (!day) return;

                  try {
                    await api.post(`/trips/${tripId}/itinerary/add-place`, {
                      day,
                      place: {
                        name: selectedPlace.name,
                        lat: selectedPlace.lat,
                        lon: selectedPlace.lon,
                        type: selectedPlace.type,
                      },
                    });

                    alert("Added to itinerary!");
                  } catch {
                    alert("Failed to add to itinerary");
                  }
                }}
                className="border p-2 rounded mt-3 w-full"
              >
                <option value="">Assign to Day...</option>
                {Array.from({ length: tripDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Saved places collapsible panel */}
      {!isGlobal && showSavedPanel && (
        <div className="w-80 border-l bg-white shadow-xl overflow-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">
              Saved Places ({savedPlaces.length})
            </h3>
            <button onClick={() => setShowSavedPanel(false)}>Close</button>
          </div>

          <div className="p-4 space-y-2">
            {savedPlaces.length === 0 ? (
              <p className="text-sm text-gray-500">No saved places</p>
            ) : (
              savedPlaces.map((p, i) => (
                <div
                  key={`${p.id ?? p.place_id ?? p.name}-${p.lat}-${p.lon}-${i}`}
                  className="border p-2 rounded cursor-pointer hover:bg-green-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{p.name}</strong>
                      <div className="text-sm text-gray-600">
                        {p.type} • {p.distance_km} km
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-2">
                      <button
                        onClick={() => {
                          const lat = Number(p.lat);
                          const lon = Number(p.lon);
                          if (
                            !mapRef.current ||
                            Number.isNaN(lat) ||
                            Number.isNaN(lon)
                          ) {
                            console.warn("Map not ready or invalid coords");
                            return;
                          }
                          setShowSavedPanel(false);
                          setTimeout(() => {
                            try {
                              mapRef.current.invalidateSize();
                            } catch {
                              /* ignore */
                            }
                            mapRef.current.flyTo([lat, lon], 15, {
                              animate: true,
                              duration: 0.8,
                            });
                            setTimeout(() => {
                              L.popup({ autoClose: true })
                                .setLatLng([lat, lon])
                                .setContent(
                                  `<strong>${p.name}</strong><br/>Saved • ${p.distance_km} km`,
                                )
                                .openOn(mapRef.current);
                            }, 350);
                          }, 120);
                        }}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                      >
                        View
                      </button>

                      <button
                        onClick={() => removeSavedPlace(p)}
                        className="text-xs border px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
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
                  // open google directions and clear alert
                  openGoogleDirections(nearbyAlert.lat, nearbyAlert.lon);
                  setNearbyAlert(null);
                }}
                className="flex-1 bg-green-600 text-white py-1 rounded text-sm"
              >
                View in Google Maps
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
          <div className="bg-red-100 text-red-800 px-3 py-2 rounded">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
