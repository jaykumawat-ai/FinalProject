// src/pages/Booking.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { IndianRupee, Wallet } from "lucide-react";

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tripRes = await api.get(`/trips/my-trips`);
      const found = tripRes.data.find((t) => t.id === id);
      setTrip(found || null);

      const walletRes = await api.get("/wallet");
      setWalletBalance(walletRes.data.balance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading booking...</div>;
  if (!trip) return <div className="p-6">Trip not found</div>;

  const totalCost = trip.final_cost || 0;
  const insufficient = walletBalance < totalCost;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Confirm Booking 💳</h1>

      <div className="bg-white shadow rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <IndianRupee size={18} />
          <p>
            <strong>Total Cost:</strong> ₹{totalCost}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Wallet size={18} />
          <p>
            <strong>Your Wallet:</strong> ₹{walletBalance}
          </p>
        </div>

        {insufficient && (
          <p className="text-red-600 text-sm">
            Insufficient wallet balance.
          </p>
        )}

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 border rounded py-3"
          >
            Back
          </button>

          <button
            disabled={insufficient || bookingLoading}
            onClick={async () => {
              try {
                setBookingLoading(true);
                const res = await api.post(`/trips/book/${id}`);
                setWalletBalance(res.data.remaining_balance);

                alert("🎉 Trip Booked Successfully!");
                navigate(`/trips/${id}`);
              } catch (err) {
                alert(err.response?.data?.detail || "Booking failed");
              } finally {
                setBookingLoading(false);
              }
            }}
            className="flex-1 bg-green-600 text-white rounded py-3"
          >
            {bookingLoading ? "Processing..." : "Pay & Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
