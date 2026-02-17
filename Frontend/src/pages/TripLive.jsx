// src/pages/TripDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { Plane, Calendar, Users, IndianRupee } from "lucide-react";
import TripMap from "../components/TripMap";

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransport, setSelectedTransport] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState("family");
  const [nearbySuggestions, setNearbySuggestions] = useState([]);

  useEffect(() => {
    async function loadWallet() {
      try {
        const res = await api.get("/wallet");
        setWalletBalance(res.data.balance);
      } catch (err) {
        console.error("Failed to load wallet", err);
      }
    }
    loadWallet();
  }, []);

  useEffect(() => {
    fetchTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await api.get("/trips/my-trips");
      const found = res.data.find((t) => t.id === id);
      setTrip(found || null);
    } catch (err) {
      console.error("Failed to load trip", err);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  };

  const confirmTrip = async () => {
    try {
      if (!selectedTransport) {
        alert("Please select a transport option");
        return;
      }
      await api.post(`/trips/confirm/${trip.id}`, {
        selected_transport: selectedTransport,
      });
      navigate(`/trips/${id}/review`);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm trip");
    }
  };

  const deleteTrip = async () => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    try {
      await api.delete(`/trips/${trip.id}`);
      alert("Trip deleted");
      navigate("/my-trips");
    } catch (err) {
      console.error(err);
      alert("Failed to delete trip");
    }
  };

  const calculateEstimatedCost = () => {
    if (!trip) return 0;
    const perDayCost = 1000; // same as backend
    const transportCost =
      selectedTransport?.estimated_cost ||
      trip.selected_transport?.estimated_cost ||
      trip.plan?.transport?.options?.find(
        (o) => o.mode === trip.plan.transport.recommended
      )?.estimated_cost ||
      0;
    const total = (transportCost + perDayCost * trip.days) * trip.people;
    return total;
  };

  const getOfficialBookingLink = () => {
    const transport = trip.selected_transport || selectedTransport;
    if (!transport) return null;
    const mode = transport.mode?.toLowerCase();
    const source = trip.source;
    const destination = trip.destination;
    if (mode === "flight") {
      return `https://www.google.com/travel/flights?q=${source}+to+${destination}`;
    }
    if (mode === "train") {
      return `https://www.irctc.co.in/`;
    }
    if (mode === "bus") {
      return `https://www.redbus.in/`;
    }
    return null;
  };

  /**
   * loadAIRecommendations:
   * - Uses POST (backend expects POST)
   * - Sends companion type (query param) so server can tailor suggestions
   * - Accepts either structured JSON or fallback text and maps fields
   */
  const loadAIRecommendations = async (companionType) => {
    if (!trip) return;
    setAiLoading(true);
    setAiInsights(null);
    setNearbySuggestions([]);

    try {
      // Backend route is POST /trips/{trip_id}/recommendations
      // Send companion type as query param (server reads Query param `companions`)
      const res = await api.post(
        `/trips/${trip.id}/recommendations?companions=${encodeURIComponent(
          companionType
        )}`
      );

      const data = res.data;

      // If the backend returned structured fields (preferred)
      if (data && (data.budget_analysis || data.activity_analysis || data.cost_optimization || data.itinerary_optimization || data.experience_enhancement)) {
        // Build a readable multi-card string for UI (also keep raw nearby_recommendations array)
        const parts = [];
        const safeText = (val) => {
  if (typeof val === "string") return val;
  return JSON.stringify(val, null, 2);
};

if (data.budget_analysis)
  parts.push({ title: "Budget Analysis", text: safeText(data.budget_analysis) });

if (data.activity_analysis)
  parts.push({ title: "Activity Analysis", text: safeText(data.activity_analysis) });

if (data.cost_optimization)
  parts.push({ title: "Cost Optimization", text: safeText(data.cost_optimization) });

if (data.itinerary_optimization)
  parts.push({ title: "Itinerary Optimization", text: safeText(data.itinerary_optimization) });


        // Convert to a single string where each block separated by two newlines
        setAiInsights(data);

        // nearby suggestions (optional structured list)
        if (Array.isArray(data.nearby_recommendations)) {
          setNearbySuggestions(data.nearby_recommendations);
        }
      } else if (data && typeof data.recommendations === "string") {
        // Fallback plain-text response from older endpoints
        setAiInsights(data.recommendations);
      } else if (typeof data === "string") {
        // If the server returned raw text
        setAiInsights(data);
      } else {
        setAiInsights("AI returned unexpected format. See server logs.");
      }
    } catch (err) {
      console.error("AI recommendation failed", err);
      // Show friendly message but not crash
      if (err.response && err.response.data && err.response.data.detail) {
        setAiInsights(`AI error: ${err.response.data.detail}`);
      } else {
        setAiInsights("AI recommendation failed. Check server logs.");
      }
    } finally {
      setAiLoading(false);
      setShowCompanionModal(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!trip) return <div className="p-6">Trip not found</div>;

  // Render AI insights as separate cards (if available)
  const renderAiCards = () => {
  if (!aiInsights) return null;

  return (
    <div className="space-y-4 mt-3">

      {/* Budget Analysis */}
      <div className="p-4 bg-gray-50 border rounded">
        <div className="font-semibold mb-1">Budget Analysis</div>
        <div className="text-sm text-gray-700">
          Budget: ₹{aiInsights.budget_analysis?.budget} <br />
          Final Cost: ₹{aiInsights.budget_analysis?.final_cost} <br />
          Difference: ₹{aiInsights.budget_analysis?.difference} <br />
          Status: {aiInsights.budget_analysis?.status}
        </div>
      </div>

      {/* Activity Analysis */}
      <div className="p-4 bg-gray-50 border rounded">
        <div className="font-semibold mb-1">Activity Analysis</div>
        <div className="text-sm text-gray-700">
          Overloaded Days: {aiInsights.activity_analysis?.overloaded_days?.join(", ") || "None"} <br />
          Underutilized Days: {aiInsights.activity_analysis?.underutilized_days?.join(", ") || "None"}
        </div>
      </div>

      {/* Cost Optimization */}
      <div className="p-4 bg-gray-50 border rounded">
        <div className="font-semibold mb-1">Cost Optimization</div>
        <div className="text-sm text-gray-700">
          {aiInsights.cost_optimization?.suggestion} <br />
          Estimated Savings: ₹{aiInsights.cost_optimization?.estimated_savings} <br />
          {aiInsights.cost_optimization?.reason}
        </div>
      </div>

      {/* Itinerary Optimization */}
      <div className="p-4 bg-gray-50 border rounded">
        <div className="font-semibold mb-1">Itinerary Optimization</div>
        <div className="text-sm text-gray-700">
          Day: {aiInsights.itinerary_optimization?.day} <br />
          {aiInsights.itinerary_optimization?.adjustment} <br />
          {aiInsights.itinerary_optimization?.reason}
        </div>
      </div>

    </div>
  );
};


  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {trip.source} → {trip.destination}
        </h1>

        <span
          className={`inline-block mt-3 px-4 py-2 rounded-full text-sm ${
            trip.status === "booked"
              ? "bg-green-100 text-green-700"
              : trip.status === "confirmed"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {trip.status.toUpperCase()}
        </span>
      </div>

      {/* BASIC INFO */}
      <div className="grid md:grid-cols-3 gap-6">
        <Info title="Budget" value={`₹${trip.budget}`} icon={IndianRupee} />
        <Info title="Days" value={`${trip.days} days`} icon={Calendar} />
        <Info title="People" value={`${trip.people}`} icon={Users} />
      </div>

      {/* PLAN SECTION */}
      <div className="mt-10 bg-white shadow rounded-2xl p-8">
        <h2 className="text-2xl font-semibold mb-6">Trip Plan</h2>

        {/* Hotel & Cost */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-sm text-gray-500">Recommended Hotel</p>
            <p className="text-lg font-semibold">{trip.plan?.hotel}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-sm text-gray-500">Estimated Cost</p>
            <p className="text-lg font-semibold">₹{calculateEstimatedCost()}</p>
          </div>
        </div>

        {/* TRANSPORT OPTIONS */}
        <h3 className="text-xl font-semibold mb-4">Choose Transport</h3>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {trip.plan?.transport?.options?.map((opt, i) => {
            const isSelected =
              trip.selected_transport?.mode === opt.mode ||
              selectedTransport?.mode === opt.mode;

            return (
              <div
                key={i}
                onClick={() => trip.status === "planned" && setSelectedTransport(opt)}
                className={`border rounded-xl p-4 transition ${
                  isSelected ? "border-green-600 bg-green-50" : "hover:border-green-400"
                }`}
              >
                <p className="font-semibold capitalize">{opt.mode}</p>
                <p className="text-sm text-gray-500">{opt.duration_hours} hrs</p>
                <p className="text-sm text-gray-500">₹{opt.estimated_cost}</p>

                {isSelected && <p className="text-green-600 text-xs mt-2">✓ Selected</p>}
              </div>
            );
          })}
        </div>

        {(trip.selected_transport || selectedTransport) && (
          <div className="mt-6">
            <button
              onClick={() => {
                const link = getOfficialBookingLink();
                if (link) window.open(link, "_blank");
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition"
            >
              🌐 Book on Official Website
            </button>
          </div>
        )}

        {/* ITINERARY */}
        <h3 className="text-xl font-semibold mb-4">Itinerary</h3>

        {trip.plan?.itinerary?.map((day, index) => (
          <div key={index} className="border rounded-xl p-5 mb-4 bg-gray-50">
            <p className="font-semibold mb-3">
              Day {day.day}: {day.title}
            </p>

            <ul className="space-y-2">
              {day.activities?.map((act, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <Plane size={14} />
                  {act.time} — {act.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* AI TRAVEL INSIGHTS CARD */}
      <div className="mt-10 bg-white shadow rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">🤖 AI Travel Insights</h2>

        {aiLoading && <p>Analyzing your trip...</p>}

        {!aiInsights && !aiLoading && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCompanionModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded">
              Generate Smart Insights
            </button>

            <div className="text-sm text-gray-500">
              Tailored suggestions (budget, itinerary, transport, nearby fun stuff).
            </div>
          </div>
        )}

        {aiInsights && renderAiCards()}

        {nearbySuggestions.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Nearby suggestions</h4>
            <div className="space-y-2">
              {nearbySuggestions.map((s, i) => (
                <div key={i} className="border p-3 rounded flex justify-between items-start">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-600">{s.category} — {s.reason}</div>
                  </div>

                  <div className="flex flex-col gap-2 ml-3">
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(s.name)}`, "_blank")}
                      className="text-xs bg-white border px-3 py-1 rounded"
                    >
                      Open
                    </button>

                    <button
                      onClick={async () => {
                        const dayStr = window.prompt("Which day number do you want to add this to? (e.g. 1)");
                        const day = Number(dayStr);
                        if (!day || day < 1) {
                          alert("Invalid day");
                          return;
                        }
                        try {
                          await api.post(`/trips/${trip.id}/itinerary/add-place`, {
                            day,
                            place: { name: s.name, lat: s.lat ?? null, lon: s.lon ?? null, type: s.category },
                          });
                          alert("Added to itinerary.");
                        } catch (err) {
                          console.error("Add suggestion failed", err);
                          alert("Failed to add to itinerary.");
                        }
                      }}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Add to Itinerary
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

            <div className="text-xs text-gray-500 mt-1">
              {f.reason}
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                await api.post(`/trips/${trip.id}/food/add`, {
                  food: f,
                });

                alert("🍽️ Food saved to trip!");
                fetchTrip(); // refresh trip data
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

      </div>

      {/* EXPLORE NEARBY PLACES (TripMap) */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Explore Nearby Places</h2>

        <div className="h-[600px] bg-white rounded-2xl shadow-lg border overflow-hidden">
          <TripMap tripId={trip.id} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-6 flex gap-4 items-center">
        <button onClick={deleteTrip} className="bg-red-600 text-white px-6 py-3 rounded-xl">
          Delete Trip
        </button>

        {trip.status === "planned" && (
          <button onClick={confirmTrip} className="bg-blue-600 text-white px-6 py-3 rounded-xl">
            Confirm Trip
          </button>
        )}

        {trip.status === "confirmed" && (
          <button onClick={() => setShowPaymentModal(true)} className="bg-green-600 text-white px-6 py-3 rounded-xl">
            Book Trip
          </button>
        )}
      </div>

      {/* Companion modal */}
      {showCompanionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Who are you travelling with?</h3>

            <div className="flex gap-2 mb-4">
              {["family", "friends", "couples", "solo"].map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCompanion(c)}
                  className={`px-3 py-1 rounded border ${selectedCompanion === c ? "bg-green-600 text-white" : ""}`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setShowCompanionModal(false)}>
                Cancel
              </button>

              <button className="px-3 py-1 bg-purple-600 text-white rounded" onClick={() => loadAIRecommendations(selectedCompanion)}>
                Generate Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Confirm Payment 💳</h2>

            <div className="space-y-2 text-sm">
              <p><strong>Total Cost:</strong> ₹{trip.final_cost ?? calculateEstimatedCost()}</p>
              <p><strong>Your Wallet:</strong> ₹{walletBalance}</p>
              <p className="text-gray-600 mt-2">This will deduct ₹{trip.final_cost ?? calculateEstimatedCost()} from your wallet.</p>
            </div>

            {walletBalance < (trip.final_cost ?? calculateEstimatedCost()) && (
              <p className="text-red-600 text-sm mt-2">Insufficient balance.</p>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 border rounded py-2">Cancel</button>

              <button
                disabled={walletBalance < (trip.final_cost ?? calculateEstimatedCost()) || bookingLoading}
                onClick={async () => {
                  setBookingLoading(true);
                  await new Promise((r) => setTimeout(r, 1500));

                  try {
                    const res = await api.post(`/trips/book/${trip.id}`);
                    setWalletBalance(res.data.remaining_balance);
                    setShowPaymentModal(false);
                    alert("🎉 Trip Booked Successfully!");
                    navigate(`/trips/${id}/review`);
                  } catch (err) {
                    console.error(err);
                    alert(err.response?.data?.detail || "Booking failed");
                  } finally {
                    setBookingLoading(false);
                  }
                }}
                className="flex-1 bg-green-600 text-white rounded py-2"
              >
                {bookingLoading ? "Processing..." : "Pay & Book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ title, value, icon: Icon }) {
  return (
    <div className="border rounded-xl p-6 flex items-center gap-4 bg-white shadow-sm">
      <Icon size={20} />
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
