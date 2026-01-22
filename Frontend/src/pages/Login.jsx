import { useState } from "react";
import { apiRequest } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const data = await apiRequest("/auth/login", "POST", form);

      if (!data.access_token) {
        throw new Error("No token received");
      }

      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setMsg("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-96 p-6 bg-white shadow-lg rounded-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Login
        </button>

        {msg && (
          <p className="mt-3 text-center text-red-500 font-medium">
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
