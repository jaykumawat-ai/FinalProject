// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Map,
  CreditCard,
  Plane,
  User
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/trips", label: "Trips", icon: Plane },
  { to: "/map", label: "Map", icon: Map },
  { to: "/wallet", label: "Wallet", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:block w-64 bg-white border-r min-h-screen">
      <nav className="p-4 space-y-2">
        {links.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link key={to} to={to} className="block">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer
                  ${active ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon size={18} />
                <span className="font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
