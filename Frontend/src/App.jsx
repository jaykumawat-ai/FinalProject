import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TripDetails from "./pages/TripDetails";
import TripPlanner from "./pages/TripPlanner"; 
import MyTrips from "./pages/MyTrips";
import Summary from "./pages/Summary";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/plan-trip" element={<TripPlanner />} />

     <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/my-trips"
  element={
    <ProtectedRoute>
      <MyTrips />
    </ProtectedRoute>
  }
/>


<Route
  path="/trips/:id"
  element={
    <ProtectedRoute>
      <TripDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/summary/:id"
  element={
    <ProtectedRoute>
      <Summary />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
}
