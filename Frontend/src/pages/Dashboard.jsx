// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Plane, Map, Wallet, PlusCircle, Loader2 } from "lucide-react";
// import api from "../api/api";
// import Sidebar from "../components/Sidebar";

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [trips, setTrips] = useState([]);
//   const [wallet, setWallet] = useState(0);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadDashboard = async () => {
//       try {
//         const me = await api.get("/auth/me");
//         const myTrips = await api.get("/trips/my-trips");
//         const walletRes = await api.get("/wallet");

//         // be defensive about possible response shapes
//         setUser(me.data?.user ?? me.data ?? null);
//         setTrips(myTrips.data?.trips ?? myTrips.data ?? []);
//         setWallet(walletRes.data?.balance ?? walletRes.data ?? 0);
//       } catch (err) {
//         console.error("Failed to load dashboard:", err);
//         localStorage.removeItem("access_token");
//         navigate("/");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadDashboard();
//   }, [navigate]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="animate-spin text-green-600" size={40} />
//       </div>
//     );
//   }

//   const displayName =
//     user?.name ?? user?.email?.split?.("@")?.[0] ?? "Traveler";

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       <Sidebar />

//       <main className="flex-1 p-6">
//         {/* HEADER */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
//             <p className="text-gray-600">Let’s plan your next journey ✈️</p>
//           </div>

//           <button
//             onClick={() => navigate("/plan-trip")}
//             className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
//           >
//             <PlusCircle size={18} />
//             New Trip
//           </button>
//         </div>

//         {/* STATS */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//           <StatCard icon={<Plane size={22} />} title="Total Trips" value={trips?.length ?? 0} />
//           <StatCard icon={<Wallet size={22} />} title="Wallet Balance" value={`₹ ${wallet}`} />
//           <StatCard icon={<Map size={22} />} title="Explore Places" value="Interactive Map" />
//         </div>

//         {/* TRIPS */}
//         <div className="bg-white rounded-xl shadow p-6">
//           <h2 className="text-lg font-semibold mb-4">Your Trips</h2>

//           {(trips?.length ?? 0) === 0 ? (
//             <div className="text-center py-10 text-gray-500">
//               <p>No trips yet</p>
//               <button
//                 onClick={() => navigate("/plan-trip")}
//                 className="mt-3 text-green-600 font-medium hover:underline"
//               >
//                 Plan your first trip →
//               </button>
//             </div>
//           ) : (
//             <div className="grid md:grid-cols-2 gap-4">
//               {trips.map((trip, idx) => {
//                 const tripId = trip._id ?? trip.id ?? `trip-${idx}`;
//                 return (
//                   <div
//                     key={tripId}
//                     className="border rounded-lg p-4 hover:shadow transition cursor-pointer"
//                     onClick={() => navigate(`/trips/${tripId}`)}
//                   >
//                     <h3 className="font-semibold">
//                       {trip.source} → {trip.destination}
//                     </h3>
//                     <p className="text-sm text-gray-600">Budget: ₹{trip.budget}</p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       {trip.days} days • {trip.people} people
//                     </p>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// /* ---------- SMALL COMPONENT ---------- */

// function StatCard({ icon, title, value }) {
//   return (
//     <div className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
//       <div className="bg-green-100 text-green-700 p-3 rounded-full">{icon}</div>
//       <div>
//         <p className="text-sm text-gray-500">{title}</p>
//         <p className="text-lg font-semibold">{value}</p>
//       </div>
//     </div>
//   );
// }
