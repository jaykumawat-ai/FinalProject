// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TripDetails from "./pages/TripDetails"; // setup page
import TripPlanner from "./pages/TripPlanner";
import MyTrips from "./pages/MyTrips";
import Summary from "./pages/Summary"; // review (AI optional)
import Wallet from "./pages/Wallet";
import AppLayout from "./layout/AppLayout";
import MapPage from "./pages/ExploreMap";
import Profile from "./pages/Profile";
import TripGuide from "./pages/TripGuide";
import TripLive from "./pages/TripLive";
import Booking from "./pages/Booking";
import UpdatedSummary from "./pages/UpdatedSummary";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Layout Wrapper */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plan-trip" element={<TripPlanner />} />
        <Route path="/my-trips" element={<MyTrips />} />

        <Route path="/trips/:id/setup" element={<TripDetails />} />
        <Route path="/trips/:id/review" element={<Summary />} />
        <Route path="/trips/:id/updated-summary" element={<UpdatedSummary />} />
        <Route path="/trips/:id/booking" element={<Booking />} />


        <Route path="/trips/:id" element={<TripLive />} />
      

        <Route path="/trip-guide" element={<TripGuide />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/explore" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
