// FastestLapsTable.jsx
import { Link } from "react-router-dom";
import React from "react";
import { lapToMinFormat, mapDriverNames } from "../../utilities";

const FastestLapsTable = ({ laps, drivers, sessionKey, sessionName }) => {
  if (!laps?.length || !drivers?.length) return null;

 
    const lapsWithNames = mapDriverNames(laps, drivers);

    const fullLaps = lapsWithNames.filter(lap => 
        lap.lap_duration != null &&
        lap.duration_sector_1 != null &&
        lap.duration_sector_2 != null &&
        lap.duration_sector_3 != null
    )

    const fastestByDriver = Object.values(
        fullLaps.reduce((acc, lap) => {
        const driver = lap.driver_number;
        if (!acc[driver] || lap.lap_duration < acc[driver].lap_duration) {
            acc[driver] = lap;
        }
        return acc;
    }, {})
    ).sort((a, b) => a.lap_duration - b.lap_duration);

  console.log(fastestByDriver)

  return (
    <div>
      <h3>Fastest Lap Per Driver</h3>
      <table>
        <thead>
          <tr>
            <th>Driver</th>
            <th>Lap Time</th>
            <th>Lap #</th>
          </tr>
        </thead>
        <tbody>
          {fastestByDriver.map((lap) => (
            <tr key={lap.driver_number}>
            <Link to={`/practice-results/${sessionKey}/${encodeURIComponent(sessionName)}/${lap.driver_number}`}>
                <td>{lap.driver_name}</td> </Link>
                <td>{lapToMinFormat(lap.lap_duration)}</td>
                <td>{lap.lap_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FastestLapsTable;
