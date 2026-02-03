// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { MapPin, Wallet, Calendar, Airplane } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        // api.get returns axios response - data is in res.data
        if (!mounted) return;
        setUser(res.data);
      } catch (err) {
        console.warn("fetch /auth/me failed:", err);
        // clear token and redirect to login
        localStorage.removeItem("access_token");
        navigate("/login");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchUser();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  if (loadingUser) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Good day, {user?.name ?? user?.email ?? "Traveler"}</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome to TravelEase — plan smarter trips in minutes.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/trips")} className="bg-white border px-3 py-2 rounded-md shadow-sm hover:bg-green-50">
              My Trips
            </button>
            <button onClick={logout} className="bg-red-600 text-white px-3 py-2 rounded-md">Logout</button>
          </div>
        </div>

        {/* HERO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                {/* Placeholder Illustration */}
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="80" rx="12" fill="#DFF8F0"/>
                  <path d="M12 58C24 42 42 32 60 32C78 32 96 42 108 58" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="92" cy="20" r="8" fill="#10B981"/>
                </svg>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800">Plan your next trip</h2>
                <p className="text-sm text-gray-500 mt-1">We can generate a trip plan for you based on budget, dates and preferences.</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input placeholder="From (city)" className="p-2 border rounded" />
                  <input placeholder="To (city)" className="p-2 border rounded" />
                  <input placeholder="Budget (₹)" className="p-2 border rounded" />
                </div>

                <div className="mt-4 flex gap-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md">Generate Plan</button>
                  <button className="border px-4 py-2 rounded-md">Advanced options</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - small stats */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Nearby alerts</div>
                <div className="font-semibold">3 Active</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Wallet size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Wallet balance</div>
                <div className="font-semibold">₹ {user?.wallet_balance ?? "0.00"}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-50">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Upcoming trips</div>
                <div className="font-semibold">1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links / actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white p-4 rounded-2xl shadow flex items-center gap-3 hover:bg-green-50">
            <Airplane size={20} className="text-green-600" />
            <div>
              <div className="text-sm text-gray-500">New Trip</div>
              <div className="font-medium">Plan now</div>
            </div>
          </button>

          <button className="bg-white p-4 rounded-2xl shadow flex items-center gap-3 hover:bg-green-50">
            <MapPin size={20} className="text-green-600" />
            <div>
              <div className="text-sm text-gray-500">Explore</div>
              <div className="font-medium">Nearby places</div>
            </div>
          </button>

          <button className="bg-white p-4 rounded-2xl shadow flex items-center gap-3 hover:bg-green-50">
            <Wallet size={20} className="text-green-600" />
            <div>
              <div className="text-sm text-gray-500">Wallet</div>
              <div className="font-medium">Manage funds</div>
            </div>
          </button>

          <div className="bg-white p-4 rounded-2xl shadow flex items-center gap-3">
            <div>
              <div className="text-sm text-gray-500">Account</div>
              <div className="font-medium">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
