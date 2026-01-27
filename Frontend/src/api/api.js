const API_URL = "http://127.0.0.1:8080";
import axios from "axios";

export async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
}


const API = axios.create({
  baseURL: "http://127.0.0.1:8080",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const getNearbyPlaces = (tripId) =>
  API.get(`/discover/nearby?trip_id=${tripId}`);

export default API;