import api from "./api";

export const savePlaceToTrip = (tripId, place) =>
  api.post(`/trips/${tripId}/places`, place);

export const getSavedPlaces = (tripId) =>
  api.get(`/trips/${tripId}/places`);

export const removeSavedPlace = (tripId, name) =>
  api.delete(`/trips/${tripId}/places`, {
    params: { name },
  });
