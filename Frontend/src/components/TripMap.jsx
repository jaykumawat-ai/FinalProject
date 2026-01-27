import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useState } from "react";
import L from "leaflet";
import { getNearbyPlaces } from "../api/api";

// Fix Leaflet icon issue (VERY IMPORTANT)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TripMap = ({ tripId }) => {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState([15.2993, 74.1240]); // default Goa
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const loadPlaces = async () => {
      try {
        const res = await getNearbyPlaces(tripId);
        setPlaces(res.data.places || []);

        // Center map on first place if exists
        if (res.data.places?.length > 0) {
          setCenter([
            res.data.places[0].lat,
            res.data.places[0].lon,
          ]);
        }
      } catch (err) {
        console.error("Failed to load nearby places", err);
      } finally {
        setLoading(false);
      }
    };

    loadPlaces();
  }, [tripId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading nearby places…</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup chunkedLoading>
          {places.map((place, index) => (
            <Marker key={index} position={[place.lat, place.lon]}>
              <Popup>
                <div className="space-y-1">
                  <h3 className="font-semibold">{place.name}</h3>
                  <p className="text-sm text-gray-600">
                    Type: {place.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {place.distance_km} km away
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default TripMap;
