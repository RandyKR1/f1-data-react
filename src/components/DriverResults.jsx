import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getDrivers,
  getLaps,
  getPit,
  getStints,
  getIntervals,
} from "../api";
import { formatRaceTime } from "../utilities";

const DriverResults = () => {
  const { sessionKey, driverNumber } = useParams();
  const [driver, setDriver] = useState(null);
  const [laps, setLaps] = useState([]);
  const [pitStops, setPitStops] = useState([]);
  const [stints, setStints] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!sessionKey || !driverNumber) return;

      const [driversData, lapsData, pitData, stintData, intervalData] =
        await Promise.all([
          getDrivers(sessionKey),
          getLaps(sessionKey),
          getPit(sessionKey),
          getStints(sessionKey),
          getIntervals(sessionKey),
        ]);

      const selectedDriver = driversData.find(
        (d) => d.driver_number.toString() === driverNumber
      );

      setDriver(selectedDriver);
      setLaps(lapsData.filter((lap) => lap.driver_number.toString() === driverNumber));
      setPitStops(pitData.filter((p) => p.driver_number.toString() === driverNumber));
      setStints(stintData.filter((s) => s.driver_number.toString() === driverNumber));
      setIntervals(intervalData.filter((i) => i.driver_number.toString() === driverNumber));

      setLoading(false);
    };

    fetchDriverData();
  }, [sessionKey, driverNumber]);

    if (loading || !driver) {
        return <p>Loading...</p>;
    }

  const totalLapTime = laps.reduce((sum, l) => {
    const lapTime = l.lap_duration ?? ((l.duration_sector_2 ?? 0) + (l.duration_sector_3 ?? 0));
    return sum + lapTime;
  }, 0);

  const totalPitTime = pitStops.reduce((sum, p) => sum + (p.pit_duration ?? 0), 0);

  const lastInterval = intervals?.[intervals.length - 1]?.interval || "N/A";

  return (
  <div className="min-h-[91vh] p-4 bg-gray-100 overflow-hidden">
    <h2 className="text-2xl font-bold mb-4">Driver Results</h2>

    <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full">
      <Link to={`/results/${sessionKey}`} className="text-blue-500 underline mb-2 inline-block">
        ← Back to Session Results
      </Link>
      <h2 className="text-xl font-bold">
        {driver.full_name || driver.last_name}{" "}
        <span className="text-gray-500">#{driver.driver_number}</span>
      </h2>
      <p><strong>Team:</strong> {driver.team_name}</p>
      <p><strong>Country:</strong> {driver.country_code}</p>
      <p><strong>Broadcast Name:</strong> {driver.broadcast_name}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
        <p><strong>Total Laps:</strong> {laps.length}</p>
        <p><strong>Total Race Time:</strong> {formatRaceTime(totalLapTime)}</p>
        <p><strong>Total Pit Time:</strong> {formatRaceTime(totalPitTime)}</p>
        <p><strong>Final Interval:</strong> {lastInterval}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm h-[40vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Stints</h3>
        <ul className="list-disc pl-4">
          {stints.map((stint, index) => (
            <li key={index}>
              Tyre: {stint.tyre_compound} | Laps: {stint.total_laps}
            </li>
          ))}
        </ul>

        <h3 className="text-lg font-semibold mt-4 mb-2">Pit Stops</h3>
        <ul className="list-disc pl-4">
          {pitStops.map((p, index) => (
            <li key={index}>
              Lap {p.lap_number}: {formatRaceTime(p.pit_duration)} stop
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm h-[40vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Lap Times</h3>
        <ul className="list-decimal pl-4">
          {laps.map((lap) => (
            <li key={lap.lap_number}>
              Lap {lap.lap_number} — {formatRaceTime(lap.lap_duration)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

};

export default DriverResults;
