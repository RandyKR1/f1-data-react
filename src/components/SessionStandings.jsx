import React, { useEffect, useState } from "react";
import { getLaps, getDrivers } from "../api";
import {
  mapDriverNames,
  groupByDriverName,
  formatRaceTime,
  sortRaceResults,
} from "../utilities";

const SessionStandings = ({ sessionKey }) => {
  const [laps, setLaps] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return; 
        const fetchData = async () => {
        const lapsData = await getLaps(sessionKey);
        const driversData = await getDrivers(sessionKey);
            setLaps(lapsData);
            setDrivers(driversData);
            setLoading(false);
    };
    fetchData();
    }, [sessionKey]);

    if (loading || !laps.length || !drivers.length) {
        return <p>Loading Session Standings...</p>;
    }

    const lapsWithDriverName = mapDriverNames(laps, drivers);
    const lapsGroupedByDriver = groupByDriverName(lapsWithDriverName);

    const raceLengthPerDriver = Object.entries(lapsGroupedByDriver).map(
        ([driverName, laps]) => {
        const raceLength = laps.reduce((sum, l) => {
            const lapTime =
            l.lap_duration != null
                ? l.lap_duration
                : (l.duration_sector_2 ?? 0) + (l.duration_sector_3 ?? 0);
            return sum + lapTime;
        }, 0);

        return {
            driverName,
            lapCount: laps.length,
            raceLength,
            totalTimeFormatted: formatRaceTime(raceLength),
        };
        }
    );

    const sortedResults = sortRaceResults(raceLengthPerDriver);
    console.log("Sorted Results:", sortedResults);
    
    
    return (
    <div>
    <strong>Session Standings</strong>
        <ul>
            {sortedResults.map((driver) => (
            <li key={driver.driverName}>
                {driver.driverName} — Laps: {driver.lapCount}, Time:{" "}
                {driver.totalTimeFormatted}
            </li>
            ))}
        </ul>
    </div>
    );
};

export default SessionStandings;