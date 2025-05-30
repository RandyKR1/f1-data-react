import React, { useEffect, useState } from "react";
import { getLaps, getDrivers, getIntervals } from "../api";
import {
  mapDriverNames,
  groupByDriverName,
  formatRaceTime,
  sortRaceResults,
} from "../utilities";

const SessionStandings = ({ sessionKey }) => {
  const [laps, setLaps] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionKey) return;

    const fetchData = async () => {
      const lapsData = await getLaps(sessionKey);
      const intervalData = await getIntervals(sessionKey);
      const driversData = await getDrivers(sessionKey);

      setLaps(lapsData);
      setIntervals(intervalData);
      setDrivers(driversData);
      setLoading(false);
    };

    fetchData();
  }, [sessionKey]);

  if (loading || !laps.length || !drivers.length || !intervals.length) {
    return <p>Loading Session Standings...</p>;
  }

  const lapsWithDriverName = mapDriverNames(laps, drivers);
  const lapsGroupedByDriver = groupByDriverName(lapsWithDriverName);

  // Map of latest interval per driver
  const finalIntervalsByDriver = {};
  intervals.forEach((interval) => {
    finalIntervalsByDriver[interval.driver_number] = interval.interval;
  });

  const raceLengthPerDriver = Object.entries(lapsGroupedByDriver).map(
    ([driverName, driverLaps]) => {
      const raceLength = driverLaps.reduce((sum, lap) => {
        const lapTime =
          lap.lap_duration != null
            ? lap.lap_duration
            : (lap.duration_sector_2 ?? 0) + (lap.duration_sector_3 ?? 0);
        return sum + lapTime;
      }, 0);

      const driverNumber = driverLaps[0]?.driver_number;

      return {
        driverName,
        driverNumber,
        lapCount: driverLaps.length,
        raceLength,
        totalTimeFormatted: formatRaceTime(raceLength),
        finalInterval: finalIntervalsByDriver[driverNumber] || null,
      };
    }
  );

  const sortedResults = sortRaceResults(raceLengthPerDriver);

  return (
    <div>
      <strong>Session Standings</strong>
      <ul>
        {sortedResults.map((driver) => (
          <li key={driver.driverName}>
            {driver.driverName} — Laps: {driver.lapCount}, Time: {driver.totalTimeFormatted}
            {driver.finalInterval && ` (+${driver.finalInterval} behind)`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SessionStandings;
