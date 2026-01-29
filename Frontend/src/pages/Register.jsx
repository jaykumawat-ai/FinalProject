import { useState } from "react";
import api from "../api/api";

import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
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
      await api.post("/auth/register", form);
;
      setMsg("Registration successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error(error);
      setMsg("Registration failed. Email may already exist.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-96 p-6 bg-white shadow-lg rounded-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <input
          name="name"
          placeholder="Name"
          className="w-full mb-3 p-2 border rounded"
          value={form.name}
          onChange={handleChange}
          required
        />

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

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
          Register
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
