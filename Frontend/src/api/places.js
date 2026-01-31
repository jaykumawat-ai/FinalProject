import api from "./api";

/**
 * Save a place to a trip
 * Backend: POST /trips/{trip_id}/places
 */
export async function savePlaceToTrip(tripId, place) {
  const res = await api.post(`/trips/${tripId}/places`, {
    name: place.name,
    lat: place.lat,
    lon: place.lon,
    type: place.type,
    distance_km: place.distance_km,
  });

  return res.data;
}

/** Get saved places of a trip */
export async function getTripPlaces(tripId) {
  const res = await api.get(`/trips/${tripId}/places`);
  return res.data;
}
