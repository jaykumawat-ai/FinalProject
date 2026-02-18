// src/pages/UpdatedSummary.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { MapPin, Plane, Hotel, Calendar } from "lucide-react";

export default function UpdatedSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    try {
      const res = await api.get("/trips/my-trips");
      const found = res.data.find((t) => t.id === id);
      setTrip(found || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!trip) return <div className="p-6">Trip not found</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Updated Trip Summary ✨</h1>

      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <MapPin size={18} /> Route
        </h2>
        <p>
          {trip.source} → {trip.destination}
        </p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Plane size={18} /> Transport
        </h2>
        <p>{trip.selected_transport?.mode}</p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Hotel size={18} /> Hotel
        </h2>
        <p>{trip.plan?.hotel}</p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} /> Itinerary
        </h2>

        {trip.plan?.itinerary?.map((day, i) => (
          <div key={i} className="border rounded-lg p-4 mb-3 bg-gray-50">
            <p className="font-semibold">
              Day {day.day}: {day.title}
            </p>
            <ul className="text-sm mt-2">
              {day.activities?.map((act, idx) => (
                <li key={idx}>
                  {act.time} — {act.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
    onClick={() => navigate(`/trips/${id}/booking`)}
    className="bg-green-600 text-white px-6 py-3 rounded-xl"
  >
    Proceed to Booking
  </button>

  <button
    onClick={() => navigate(`/trips/${id}/review`)}
    className="ml-4 border px-6 py-3 rounded-xl"
  >
    Back to Summary
  </button>
    </div>
  );
}
