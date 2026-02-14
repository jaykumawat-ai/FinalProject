import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { Plane, Calendar, Users, IndianRupee, CheckCircle } from "lucide-react";

export default function TripDetails() {
  const { id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransport, setSelectedTransport] = useState(null);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const res = await api.get("/trips/my-trips");
      const found = res.data.find((t) => t.id === id);
      setTrip(found || null);
    } catch (err) {
      console.error("Failed to load trip", err);
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
      fetchTrip();
    } catch (err) {
      alert("Failed to confirm trip");
    }
  };

  const bookTrip = async () => {
    try {
      await api.post(`/trips/book/${trip.id}`);
      fetchTrip();
    } catch (err) {
      alert("Booking failed");
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

  const total =
    (transportCost + perDayCost * trip.days) * trip.people;

  return total;
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
            <p className="text-lg font-semibold">
              ₹{calculateEstimatedCost()}
            </p>
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
      <p className="text-sm text-gray-500">
        ₹{opt.estimated_cost}
      </p>

      {isSelected && (
        <p className="text-green-600 text-xs mt-2">
          ✓ Selected
        </p>
      )}
    </div>
  );
})}

        </div>

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

      {/* ACTION BUTTONS */}
      <div className="mt-8 flex gap-4 flex-wrap">
        {trip.status === "planned" && (
          <button
            onClick={confirmTrip}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl"
          >
            Confirm Trip
          </button>
        )}

        {trip.status === "confirmed" && (
          <button
            onClick={bookTrip}
            className="bg-green-600 text-white px-6 py-3 rounded-xl"
          >
            Book Trip
          </button>
        )}
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
