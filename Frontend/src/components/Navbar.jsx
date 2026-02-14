import { Bell, Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Menu className="md:hidden cursor-pointer" />
          <h1 className="text-xl font-semibold text-green-700">
            TravelEase
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Bell className="text-gray-600 cursor-pointer" />
          <div className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center">
            J
          </div>
        </div>
      </div>
    </header>
  );
}
