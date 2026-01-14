import { useEffect, useState } from "react";

function App() {
  const [backendData, setBackendData] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/test")
      .then((res) => res.json())
      .then((data) => {
        console.log("Backend response:", data);
        setBackendData(data.connection);
      })
      .catch((err) => {
        console.error("Connection error:", err);
        setBackendData("failed");
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        TravelEase
      </h1>

      <p className="text-lg">
        Backend connection status:
        <span className="ml-2 font-semibold">
          {backendData}
        </span>
      </p>
    </div>
  );
}

export default App;
