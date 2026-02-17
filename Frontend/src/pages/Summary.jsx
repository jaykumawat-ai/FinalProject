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

  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState("family");
  const [nearbySuggestions, setNearbySuggestions] = useState([]);

  useEffect(() => {
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/${id}/review`);
      setTrip(res.data);
    } catch (err) {
      console.warn(
        "Primary summary endpoint failed, falling back to list fetch.",
        err,
      );
      try {
        const res2 = await api.get("/trips/my-trips");
        const found = Array.isArray(res2.data)
          ? res2.data.find((t) => String(t.id) === String(id))
          : null;
        setTrip(found || null);
      } catch (err2) {
        console.error("Failed to load trip (both endpoints).", err2);
        setTrip(null);
      }
    } finally {
      setLoading(false);
    }
  };
  const loadAIRecommendations = async (companionType) => {
    if (!trip) return;

    setAiLoading(true);
    setAiInsights(null);
    setNearbySuggestions([]);

    try {
      const res = await api.post(
        `/trips/${trip.id}/recommendations?companions=${encodeURIComponent(companionType)}`,
      );

      const data = res.data;

      if (
        data &&
        (data.budget_analysis ||
          data.activity_analysis ||
          data.cost_optimization ||
          data.itinerary_optimization)
      ) {
        setAiInsights(data);

        if (Array.isArray(data.nearby_recommendations)) {
          setNearbySuggestions(data.nearby_recommendations);
        }
      } else if (typeof data === "string") {
        setAiInsights(data);
      } else {
        setAiInsights("AI returned unexpected format.");
      }
    } catch (err) {
      console.error("AI recommendation failed", err);
      setAiInsights("AI recommendation failed.");
    } finally {
      setAiLoading(false);
      setShowCompanionModal(false);
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
  const route = summary.route ?? {
    source: trip.source,
    destination: trip.destination,
  };
  const selectedTransport =
    summary.selected_transport ?? trip.selected_transport ?? {};
  const hotel = summary.hotel ?? trip.plan?.hotel ?? "—";
  const financialTotal = summary.financial?.total_paid ?? trip.final_cost ?? 0;
  const itinerary = summary.itinerary ?? trip.plan?.itinerary ?? [];
  const confidence = summary.confidence ?? trip.plan?.confidence ?? 0.6;
  const generatedAt = summary.generated_at ?? trip.generated_at ?? null;

  const renderAiCards = () => {
    if (!aiInsights) return null;

    return (
      <div className="space-y-4 mt-4">
        <div className="p-4 bg-gray-50 border rounded">
          <div className="font-semibold mb-1">Budget Analysis</div>
          <div className="text-sm">
            Budget: ₹{aiInsights.budget_analysis?.budget} <br />
            Final Cost: ₹{aiInsights.budget_analysis?.final_cost} <br />
            Difference: ₹{aiInsights.budget_analysis?.difference} <br />
            Status: {aiInsights.budget_analysis?.status}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border rounded">
          <div className="font-semibold mb-1">Activity Analysis</div>
          <div className="text-sm">
            Overloaded Days:{" "}
            {aiInsights.activity_analysis?.overloaded_days?.join(", ") ||
              "None"}{" "}
            <br />
            Underutilized Days:{" "}
            {aiInsights.activity_analysis?.underutilized_days?.join(", ") ||
              "None"}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border rounded">
          <div className="font-semibold mb-1">Cost Optimization</div>
          <div className="text-sm">
            {aiInsights.cost_optimization?.suggestion} <br />
            Estimated Savings: ₹
            {aiInsights.cost_optimization?.estimated_savings}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border rounded">
          <div className="font-semibold mb-1">Itinerary Optimization</div>
          <div className="text-sm">
            Day: {aiInsights.itinerary_optimization?.day} <br />
            {aiInsights.itinerary_optimization?.adjustment}
          </div>
        </div>
      </div>
    );
  };

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
            onClick={() => navigate(`/trips/${id}/setup`)}
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

        <p>
          <strong>Mode:</strong> {selectedTransport?.mode ?? "—"}
        </p>
        <p>
          <strong>Duration:</strong> {selectedTransport?.duration_hours ?? "—"}{" "}
          hrs
        </p>
        <p>
          <strong>Cost:</strong>{" "}
          {formatINR(
            selectedTransport?.estimated_cost ?? summary?.estimated_total_cost,
          )}
        </p>
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

        <p>
          <strong>Total Paid:</strong> {formatINR(financialTotal)}
        </p>
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

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => navigate(`/trips/${id}/booking`)}
          className="bg-green-600 text-white px-6 py-3 rounded-xl"
        >
          Proceed to Booking
        </button>

        <button
          onClick={() => setShowCompanionModal(true)}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl"
        >
          Generate AI Insights
        </button>
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

      {/* 🤖 AI TRAVEL INSIGHTS */}
      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">AI Travel Insights</h2>

        {aiLoading && <p>Analyzing your trip...</p>}

        {!aiInsights && !aiLoading && (
          <button
            onClick={() => setShowCompanionModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Generate Smart Insights
          </button>
        )}

        {aiInsights && renderAiCards()}

        {/* 🍽️ Food Recommendations */}
        {aiInsights?.food_recommendations?.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Popular Local Food</h4>

            <div className="space-y-2">
              {aiInsights.food_recommendations.map((f, i) => (
                <div
                  key={i}
                  className="border p-3 rounded bg-gray-50 flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium">{f.dish}</div>

                    <div className="text-sm text-gray-600">
                      {f.restaurant} — {f.area}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">{f.reason}</div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/trips/${trip.id}/food/add`, {
                          food: f,
                        });

                        navigate(`/trips/${trip.id}/updated-summary`);

                        alert("🍽️ Food saved to trip!");
                        fetchTrip();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to save food.");
                      }
                    }}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nearby suggestions */}
        {nearbySuggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {nearbySuggestions.map((s, i) => (
              <div key={i} className="border p-3 rounded flex justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-600">{s.category}</div>
                </div>

                <button
                  onClick={async () => {
                    const day = Number(prompt("Which day number?"));
                    if (!day) return;

                    await api.post(`/trips/${trip.id}/itinerary/add-place`, {
                      day,
                      place: {
                        name: s.name,
                        lat: s.lat ?? null,
                        lon: s.lon ?? null,
                        type: s.category,
                      },
                    });

                    alert("Added to itinerary!");
                    fetchTrip();
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STATUS / CONFIDENCE */}
      <div className="bg-white shadow rounded-xl p-6 mt-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <CheckCircle size={18} /> Status
        </h2>

        <p>
          Status: <strong>{trip.status ?? "—"}</strong>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Confidence: {(Number(confidence) * 100).toFixed(0)}%
        </p>
        {generatedAt && (
          <p className="text-sm text-gray-600 mt-1">
            Generated at: {new Date(generatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {showCompanionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">
              Who are you travelling with?
            </h3>

            <div className="flex gap-2 mb-4">
              {["family", "friends", "couples", "solo"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompanion(c)}
                  className={`px-3 py-1 rounded border ${
                    selectedCompanion === c ? "bg-green-600 text-white" : ""
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setShowCompanionModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-3 py-1 bg-purple-600 text-white rounded"
                onClick={() => loadAIRecommendations(selectedCompanion)}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
