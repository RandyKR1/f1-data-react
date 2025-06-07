// FastestLapsTable.jsx
import { useNavigate } from "react-router-dom";
import React from "react";
import { lapToMinFormat, mapDriverNames } from "../../utilities";

const FastestLapsTable = ({ laps, drivers, sessionKey, sessionName }) => {
  if (!laps?.length || !drivers?.length) return null;

 
    const lapsWithNames = mapDriverNames(laps, drivers);
    const navigate = useNavigate();

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
    <div className="border border-secondary rounded-3">
      <h3>Results</h3>
      <table className="table table-dark table-striped">
        <thead>
          <tr>
            <th>Place</th>
            <th>Driver</th>
            <th>Lap Time</th>
            <th>Lap</th>
            <th>Sector 1</th>
            <th>Sector 2</th>
            <th>Sector 3</th>
          </tr>
        </thead>
        <tbody>
          {fastestByDriver.map((lap, index) => (
            <tr key={lap.driver_number}
                role="button"
                onClick={ () =>
                  navigate(
                    `/practice-results/${sessionKey}/${encodeURIComponent(sessionName)}/${lap.driver_number}`
                  )
                 }>
                <td>{index + 1}</td>
                <td>{lap.driver_name}</td> 
                <td>{lapToMinFormat(lap.lap_duration)}</td>
                <td>{lap.lap_number}</td>
                <td>{lap.duration_sector_1}</td>
                <td>{lap.duration_sector_2}</td>
                <td>{lap.duration_sector_3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FastestLapsTable;
