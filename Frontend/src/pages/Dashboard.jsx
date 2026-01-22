import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const data = await apiRequest("/auth/me");
      setUser(data);
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  fetchUser();
}, [navigate]);


  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>

        <p className="mb-4">
          Logged in as: <strong>{user.email}</strong>
        </p>

        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
        <hr className="my-6" />

<h2 className="text-xl font-semibold mb-3">Plan Your Trip</h2>

<input
  placeholder="Source"
  className="w-full p-2 border rounded mb-3"
/>

<input
  placeholder="Destination"
  className="w-full p-2 border rounded mb-3"
/>

<input
  placeholder="Budget (₹)"
  className="w-full p-2 border rounded mb-3"
/>

<button className="bg-green-600 text-white px-4 py-2 rounded w-full">
  Generate Trip Plan
</button>

      </div>
    </div>
  );
}
