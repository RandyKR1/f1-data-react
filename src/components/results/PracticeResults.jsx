import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLaps, getStints, getDrivers, getWeather } from "../api";
import Weather from "./Weather";

const PracticeResults = () => {
  const { sessionKey } = useParams(); // FP1, FP2, FP3 session key
  const [drivers, setDrivers] = useState([]);
  const [fastestLaps, setFastestLaps] = useState([]);
  const [stints, setStints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [lapData, stintData, driverData] = await Promise.all([
        getLaps(sessionKey),
        getStints(sessionKey),
        getDrivers(sessionKey),
      ]);

      // Get fastest lap per driver
      const byDriver = {};
      for (let lap of lapData) {
        const existing = byDriver[lap.driver_number];
        if (!existing || lap.lap_time < existing.lap_time) {
          byDriver[lap.driver_number] = lap;
        }
      }

      const fastest = Object.values(byDriver).sort((a, b) => a.lap_time - b.lap_time);

      setFastestLaps(fastest);
      setStints(stintData);
      setDrivers(driverData);
      setLoading(false);
    };

    fetchData();
  }, [sessionKey]);

  const getDriverName = (driver_number) =>
    drivers.find((d) => d.driver_number === driver_number)?.last_name || "Unknown";

  const getLongestStintByCompound = () => {
    const result = {};
    for (let stint of stints) {
      const length = stint.lap_end - stint.lap_start + 1;
      const key = stint.compound;
      if (!result[key] || length > result[key].length) {
        result[key] = {
          length,
          driver: getDriverName(stint.driver_number),
          compound: stint.compound,
        };
      }
    }
    return Object.values(result);
  };

  if (loading) {
    return <div className="p-4">Loading practice results...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Practice Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <Weather sessionKey={sessionKey} />
        </div>

        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Fastest Laps</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Lap Time</th>
                <th>Lap #</th>
              </tr>
            </thead>
            <tbody>
              {fastestLaps.map((lap) => (
                <tr key={lap.driver_number}>
                  <td>{getDriverName(lap.driver_number)}</td>
                  <td>{lap.lap_time.toFixed(3)}</td>
                  <td>{lap.lap_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mt-6">
        <h3 className="text-lg font-semibold mb-2">Longest Stint by Compound</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Compound</th>
              <th>Driver</th>
              <th>Length (laps)</th>
            </tr>
          </thead>
          <tbody>
            {getLongestStintByCompound().map((entry) => (
              <tr key={entry.compound}>
                <td>{entry.compound}</td>
                <td>{entry.driver}</td>
                <td>{entry.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PracticeResults;
