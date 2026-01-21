import { useState } from "react";
import { loginUser } from "../api/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginUser(form);

    if (res.access_token) {
      localStorage.setItem("token", res.access_token);
      window.location.href = "/dashboard";
    } else {
      setMsg("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-96 p-6 shadow-lg rounded-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <input
          name="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          onChange={handleChange}
        />

        <button className="w-full bg-green-600 text-white py-2 rounded">
          Login
        </button>

        <p className="mt-3 text-center text-red-500">{msg}</p>
      </form>
    </div>
  );
}
