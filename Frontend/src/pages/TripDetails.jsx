import { useParams } from "react-router-dom";
import TripMap from "../components/TripMap";

export default function TripDetails() {
  const { id } = useParams();

  return (
    <div>
      <h2>Trip Details</h2>
      <TripMap tripId={id} />
    </div>
  );
}
