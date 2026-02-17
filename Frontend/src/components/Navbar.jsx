import { Bell, Menu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        
        <div className="flex items-center gap-3">
          <Menu className="md:hidden cursor-pointer" />
          <h1 className="text-xl font-semibold text-green-700">
            TravelEase
          </h1>
        </div>

        <div className="flex items-center gap-6">
          
          <Bell className="text-gray-600 cursor-pointer" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>
      </div>
    </header>
  );
}
