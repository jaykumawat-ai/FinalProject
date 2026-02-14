import { useEffect, useState } from "react";
import api from "../api/api";
import { Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await api.get("/trips/my-trips");
        setTrips(res.data || []);
      } catch (err) {
        console.error("Failed to load trips", err);
      }
    };

    fetchTrips();
  }, []);

  const filteredTrips =
    activeTab === "all"
      ? trips
      : trips.filter((trip) => trip.status === activeTab);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Trips 🌍</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["all", "planned", "confirmed", "booked"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full capitalize transition ${
              activeTab === tab
                ? "bg-green-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">
            No Trips Yet ✈️
          </h2>
          <p className="text-gray-500 mb-4">
            Start planning your first journey
          </p>
          <button
            onClick={() => navigate("/plan-trip")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Plan Trip
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}

              className="bg-white rounded-xl shadow hover:shadow-xl transition overflow-hidden"
            >
              <div
                className="h-40 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(https://source.unsplash.com/600x400/?travel,destination)",
                }}
              />

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">
                  {trip.source} → {trip.destination}
                </h3>

                <p className="text-sm text-gray-500 mb-3">
                  Budget: ₹{trip.budget}
                </p>

                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {trip.days} days
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {trip.people}
                  </span>
                </div>

             <span
  className={`inline-block px-3 py-1 text-xs rounded-full mb-3 ${
    trip.status === "booked"
      ? "bg-green-100 text-green-700"
      : trip.status === "confirmed"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
  {trip.status || "planned"}
</span>

                <button
                  onClick={() => navigate(`/trips/${trip.id}`)}

                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
