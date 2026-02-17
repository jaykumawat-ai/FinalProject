// frontend: src/pages/Summary.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import {
  MapPin,
  Plane,
  Hotel,
  IndianRupee,
  Calendar,
  CheckCircle,
} from "lucide-react";
import TripMap from "../components/TripMap";

export default function SummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // New: map visibility toggle
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/summary/${id}`);
      setTrip(res.data);
    } catch (err) {
      console.warn("Primary summary endpoint failed, falling back to list fetch.", err);
      try {
        const res2 = await api.get("/trips/my-trips");
        const found = Array.isArray(res2.data) ? res2.data.find((t) => String(t.id) === String(id)) : null;
        setTrip(found || null);
      } catch (err2) {
        console.error("Failed to load trip (both endpoints).", err2);
        setTrip(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (value) => {
    const n = Number(value ?? 0);
    return `₹${isNaN(n) ? "0" : n.toLocaleString("en-IN")}`;
  };

  if (loading) return <div className="p-6">Loading summary...</div>;
  if (!trip) return <div className="p-6">Trip not found</div>;

  // Prefer summary fields where available, otherwise fallback
  const summary = trip.summary ?? {};
  const route = summary.route ?? { source: trip.source, destination: trip.destination };
  const selectedTransport = summary.selected_transport ?? trip.selected_transport ?? {};
  const hotel = summary.hotel ?? trip.plan?.hotel ?? "—";
  const financialTotal = summary.financial?.total_paid ?? trip.final_cost ?? 0;
  const itinerary = summary.itinerary ?? trip.plan?.itinerary ?? [];
  const confidence = summary.confidence ?? trip.plan?.confidence ?? 0.6;
  const generatedAt = summary.generated_at ?? trip.generated_at ?? null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Trip Summary</h1>

      {/* ROUTE */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <MapPin size={18} /> Route
        </h2>
        <p className="text-lg font-medium">
          {route.source ?? "Unknown"} → {route.destination ?? "Unknown"}
        </p>

        {/* Quick actions: toggle map + proceed */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setShowMap((v) => !v)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            {showMap ? "Hide Map" : "Explore Nearby Places"}
          </button>

          <button
            onClick={() => navigate(`/trips/${id}`)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            Proceed to Trip Details
          </button>

          {/* optional: a small status label */}
          <span className="ml-auto text-sm text-gray-500">
            Status: <strong className="ml-1">{trip.status ?? "—"}</strong>
          </span>
        </div>
      </div>

      {/* TRANSPORT */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Plane size={18} /> Selected Transport
        </h2>

        <p><strong>Mode:</strong> {selectedTransport?.mode ?? "—"}</p>
        <p><strong>Duration:</strong> {selectedTransport?.duration_hours ?? "—"} hrs</p>
        <p><strong>Cost:</strong> {formatINR(selectedTransport?.estimated_cost ?? summary?.estimated_total_cost)}</p>
      </div>

      {/* HOTEL */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Hotel size={18} /> Hotel
        </h2>
        <p>{hotel}</p>
      </div>

      {/* FINANCIAL */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <IndianRupee size={18} /> Financial Summary
        </h2>

        <p><strong>Total Paid:</strong> {formatINR(financialTotal)}</p>
        {summary.financial?.wallet_transaction && (
          <p className="mt-2 text-sm text-gray-600">
            <strong>Transaction:</strong> {summary.financial.wallet_transaction}
          </p>
        )}
      </div>

      {/* ITINERARY */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} /> Itinerary
        </h2>

        {Array.isArray(itinerary) && itinerary.length > 0 ? (
          itinerary.map((day, i) => (
            <div key={i} className="border rounded-lg p-4 mb-4 bg-gray-50">
              <p className="font-semibold mb-2">
                Day {day.day ?? i + 1}: {day.title ?? `Day ${day.day ?? i + 1}`}
              </p>

              <ul className="space-y-1 text-sm">
                {Array.isArray(day.activities) && day.activities.length > 0 ? (
                  day.activities.map((act, idx) => (
                    <li key={idx}>
                      {act.time ?? "—"} — {act.name ?? "—"}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No activities listed</li>
                )}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No itinerary available</p>
        )}
      </div>

      {/* MAP: show only if user toggled */}
      {showMap && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Explore Nearby Places</h2>

          {/* IMPORTANT: fixed-height + overflow-hidden container prevents map from growing beyond its area */}
          <div className="h-[600px] bg-white rounded-2xl shadow overflow-hidden">
            {/* TripMap expects to fill its parent; keep parent height fixed */}
            <TripMap tripId={trip.id ?? id} />
          </div>
        </div>
      )}

      {/* STATUS / CONFIDENCE */}
      <div className="bg-white shadow rounded-xl p-6 mt-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={18} /> Status
        </h2>

        <p>Status: <strong>{trip.status ?? "—"}</strong></p>
        <p className="text-sm text-gray-600 mt-2">Confidence: {(Number(confidence) * 100).toFixed(0)}%</p>
        {generatedAt && <p className="text-sm text-gray-600 mt-1">Generated at: {new Date(generatedAt).toLocaleString()}</p>}
      </div>
    </div>
  );
}
