import { useEffect, useState } from "react";
import api from "../api/api";

export default function TripGuide() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookedTrips();
  }, []);

  const fetchBookedTrips = async () => {
    try {
      const res = await api.get("/trips/booked");
      setTrips(res.data);
    } catch (err) {
      console.error("Failed to load booked trips", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        🧭 Your Travel Guide
      </h1>

      {trips.length === 0 && (
        <p>No booked trips yet.</p>
      )}

      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white shadow rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold">
            {trip.source} → {trip.destination}
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            {trip.days} days • {trip.people} people
          </p>

          {/* ITINERARY */}
          <h3 className="font-semibold mb-2">
            Itinerary
          </h3>

          {trip.plan?.itinerary?.map((day, i) => (
            <div key={i} className="mb-4">
              <div className="font-medium">
                Day {day.day}: {day.title}
              </div>

              <ul className="text-sm text-gray-700 ml-4 mt-1">
                {day.activities?.map((a, j) => (
                  <li key={j}>
                    {a.time} — {a.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* SAVED FOOD */}
          {trip.saved_food?.length > 0 && (
            <>
              <h3 className="font-semibold mt-4">
                🍽 Saved Food Spots
              </h3>

              {trip.saved_food.map((f, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-700"
                >
                  {f.dish} — {f.restaurant} ({f.area})
                </div>
              ))}
            </>
          )}

          {/* SAVED PLACES */}
          {trip.saved_places?.length > 0 && (
            <>
              <h3 className="font-semibold mt-4">
                📍 Saved Places
              </h3>

              {trip.saved_places.map((p, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-700"
                >
                  {p.name}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
