import { useEffect, useState } from "react";
import { testBackend } from "./api/api";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    testBackend()
      .then(() => setStatus("working"))
      .catch(() => setStatus("failed"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">TravelEase</h1>
      <p className="mt-4 text-lg">
        Backend connection status:{" "}
        <span className="font-semibold">{status}</span>
      </p>
    </div>
  );
}

export default App;
