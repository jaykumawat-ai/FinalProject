import { useEffect, useState } from "react";
import api from "../api/api";
import { User, Mail, Wallet, Plane } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const me = await api.get("/auth/me");
      const walletRes = await api.get("/wallet/");
      const tripsRes = await api.get("/trips/my-trips");

      setUser(me.data?.user ?? me.data);
      setWallet(walletRes.data.balance);
      setTrips(tripsRes.data || []);
    } catch (err) {
      console.error("Profile load failed", err);
    }
  };

  const bookedTrips = trips.filter(t => t.status === "booked");
  const totalSpent = bookedTrips.reduce(
    (sum, t) => sum + (t.final_cost || 0),
    0
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">

      <h1 className="text-3xl font-bold mb-8">
        My Profile 👤
      </h1>

      {/* User Info */}
      <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
        <ProfileItem icon={User} label="Name" value={user?.name || "—"} />
        <ProfileItem icon={Mail} label="Email" value={user?.email || "—"} />
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard icon={Wallet} title="Wallet Balance" value={`₹${wallet}`} />
        <StatCard icon={Plane} title="Total Trips" value={trips.length} />
        <StatCard icon={Plane} title="Total Spent" value={`₹${totalSpent}`} />
      </div>

    </div>
  );
}

function ProfileItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <Icon size={20} className="text-green-600" />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <Icon size={22} className="text-green-600" />
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}
