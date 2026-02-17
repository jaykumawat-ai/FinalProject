import { useState } from "react";
import api from "../api/api";
import {
  MapPin,
  Users,
  Calendar,
  IndianRupee,
  Plane
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TripPlanner() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    source: "",
    destination: "",
    budget: "",
    days: "",
    people: "",
  });

  const [loading, setLoading] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generatePlan = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/trips/plan", {
        source: form.source,
        destination: form.destination,
        budget: Number(form.budget),
        days: Number(form.days),
        people: Number(form.people),
        
      });

      setTripPlan(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate trip plan");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Plan Your Trip ✈️</h1>
      <p className="text-gray-600 mb-6">
        Enter details and let TravelEase design your journey
      </p>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input icon={MapPin} label="Source" name="source" onChange={handleChange} />
        <Input icon={MapPin} label="Destination" name="destination" onChange={handleChange} />
        <Input icon={IndianRupee} label="Budget (₹)" name="budget" onChange={handleChange} />
        <Input icon={Calendar} label="Days" name="days" onChange={handleChange} />
        <Input icon={Users} label="People" name="people" onChange={handleChange} />

        <button
          onClick={generatePlan}
          disabled={loading}
          className="col-span-full bg-green-600 text-white py-3 rounded-lg
                     hover:bg-green-700 transition font-semibold"
        >
          {loading ? "Generating..." : "Generate Trip Plan"}
        </button>

        {error && <p className="text-red-600 col-span-full">{error}</p>}
      </div>

      {/* TRIP RESULT */}
      {tripPlan && (
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Your Trip Plan 🧳
          </h2>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info
              title="Recommended Transport"
              value={tripPlan.plan?.transport?.recommended}
            />
            <Info
              title="Hotel"
              value={tripPlan.plan?.hotel}
            />
            <Info
              title="Estimated Cost"
              value={
                tripPlan.plan?.estimated_cost
                  ? `₹${tripPlan.plan.estimated_cost}`
                  : "Calculating..."
              }
            />
          </div>

          {/* ACTIVITIES */}
          <h3 className="mt-6 font-semibold text-lg">Activities</h3>

          {tripPlan.plan?.itinerary?.length > 0 ? (
            <div className="mt-3 space-y-4">
              {tripPlan.plan.itinerary.map((day, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <h4 className="font-semibold mb-2">
                    {day.title}
                  </h4>

                  <ul className="list-disc ml-5 text-gray-700">
                    {day.activities?.map((act, idx) => (
                      <li key={idx}>
                        <span className="font-medium">
                          {act.time}
                        </span>{" "}
                        – {act.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mt-2">
              No activities generated.
            </p>
          )}
          <button
  onClick={() => navigate(`/trips/${tripPlan.id}`)}
  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg
             hover:bg-blue-700 transition font-semibold"
>
  View & Select Transport
</button>




          
        </div>
      )}
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function Input({ icon: Icon, label, name, onChange }) {
  return (
    <div className="flex items-center border rounded-lg px-3 py-2 gap-2">
      <Icon size={18} className="text-gray-500" />
      <input
        name={name}
        placeholder={label}
        onChange={onChange}
        className="w-full outline-none"
      />
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="font-semibold capitalize">
        {value || "—"}
      </p>
    </div>
  );
}
