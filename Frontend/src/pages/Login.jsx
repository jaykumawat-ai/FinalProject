// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res?.data?.access_token;
      if (!token) throw new Error("No token received");

      localStorage.setItem("access_token", token);
      // optional: put default header now (api interceptor already handles it)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // go to dashboard after login
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Invalid email or password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow"
      >
        <h2 className="text-2xl font-bold mb-4 text-green-800">Welcome back</h2>

        {error && (
          <div className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>
        )}

        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          className="w-full mt-1 mb-3 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
          type="email"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          className="w-full mt-1 mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-200"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className={`w-full py-3 rounded text-white font-medium transition ${
            loading ? "bg-gray-400" : "bg-green-700 hover:bg-green-800"
          }`}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Don't have an account?{" "}
          <span
            className="text-green-700 cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Create one
          </span>
        </p>
      </form>
    </div>
  );
}
