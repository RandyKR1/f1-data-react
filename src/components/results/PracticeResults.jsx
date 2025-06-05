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
    <div>
      <h2>Practice Results</h2>
      <div>
        <div>
          <Weather sessionKey={sessionKey} />
        </div>

        <div>
          <h3>Fastest Laps</h3>
          <table>
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

      <div>
        <h3>Longest Stint by Compound</h3>
        <table>
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
