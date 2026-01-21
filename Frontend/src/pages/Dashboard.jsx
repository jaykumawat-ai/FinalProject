export default function Dashboard() {
  const user = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to TravelEase 🌍</h1>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Plan a Trip</h2>
            <p className="text-sm text-gray-600">Create your next journey</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Wallet</h2>
            <p className="text-sm text-gray-600">Manage travel funds</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">My Trips</h2>
            <p className="text-sm text-gray-600">View booking history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
