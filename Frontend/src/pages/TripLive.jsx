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
        (o) => o.mode === trip.plan.transport.recommended,
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


  if (loading) return <div className="p-6">Loading...</div>;
if (!trip) return <div className="p-6">Trip not found</div>;



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
                onClick={() =>
                  trip.status === "planned" && setSelectedTransport(opt)
                }
                className={`border rounded-xl p-4 transition ${
                  isSelected
                    ? "border-green-600 bg-green-50"
                    : "hover:border-green-400"
                }`}
              >
                <p className="font-semibold capitalize">{opt.mode}</p>
                <p className="text-sm text-gray-500">
                  {opt.duration_hours} hrs
                </p>
                <p className="text-sm text-gray-500">₹{opt.estimated_cost}</p>

                {isSelected && (
                  <p className="text-green-600 text-xs mt-2">✓ Selected</p>
                )}
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

      {/* EXPLORE NEARBY PLACES (TripMap) */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Explore Nearby Places</h2>

        <div className="h-[600px] bg-white rounded-2xl shadow-lg border overflow-hidden">
          <TripMap tripId={trip.id} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-6 flex gap-4 items-center">
        <button
          onClick={deleteTrip}
          className="bg-red-600 text-white px-6 py-3 rounded-xl"
        >
          Delete Trip
        </button>
      </div>
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
