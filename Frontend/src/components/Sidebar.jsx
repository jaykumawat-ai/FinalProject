import { NavLink } from "react-router-dom";
import {
  Home,
  Plane,
  Map,
  Wallet,
  User,
} from "lucide-react";

const links = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "Trips", path: "/trips", icon: Plane },
  { label: "Map", path: "/map", icon: Map },
  { label: "Wallet", path: "/wallet", icon: Wallet },
  { label: "Profile", path: "/profile", icon: User },
  { label: "Plan Trip", path: "/plan-trip", icon: Plane }
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 bg-white border-r flex-col">
      <div className="p-6 font-bold text-xl text-green-600">
        TravelEase
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition
               ${
                 isActive
                   ? "bg-green-600 text-white"
                   : "text-gray-700 hover:bg-green-50"
               }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
