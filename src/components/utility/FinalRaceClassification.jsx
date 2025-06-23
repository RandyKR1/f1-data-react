import React from "react";
import { useNavigate } from "react-router-dom";
import { lapToMinFormat, mapDriverNames, groupByDriverName } from "../../utilities";

const FinalRaceClassification = ({ laps, drivers, sessionKey, sessionName, positionInfo }) => {
  if (!laps?.length || !drivers?.length || !positionInfo?.length) return null;

  const navigate = useNavigate();
  const lapsWithNames = mapDriverNames(laps, drivers);
  const positionWithNames = mapDriverNames(positionInfo, drivers);
  const positionsByName = groupByDriverName(positionWithNames);

  // Group laps by driver_number
  const lapsByDriver = lapsWithNames.reduce((acc, lap) => {
    if (!acc[lap.driver_number]) acc[lap.driver_number] = [];
    acc[lap.driver_number].push(lap);
    return acc;
  }, {});

  // Build result rows
  const results = Object.entries(positionsByName).map(([driverName, entries]) => {
    const finalEntry = entries[entries.length - 1];
    const driverLaps = lapsByDriver[finalEntry.driver_number] || [];

    const validLaps = driverLaps.filter(lap =>
      lap.lap_duration != null &&
      lap.duration_sector_1 != null &&
      lap.duration_sector_2 != null &&
      lap.duration_sector_3 != null
    );

    const bestLap = validLaps.reduce((best, lap) => {
      if (!best || lap.lap_duration < best.lap_duration) return lap;
      return best;
    }, null);

    return {
      driver_name: driverName,
      driver_number: finalEntry.driver_number,
      final_position: finalEntry.position,
      completed_laps: driverLaps.length,
      best_lap: bestLap,
    };
  });

  // Sort: Full-distance drivers first, DNFs at the back
  const sortedResults = results.sort((a, b) => {
    // Drivers with more laps come first
    if (b.completed_laps !== a.completed_laps) {
      return b.completed_laps - a.completed_laps;
    }
    // Then by final position
    return a.final_position - b.final_position;
  });

  console.log("sorted results", sortedResults)

  return (
    <div className="col-xs-12">
      <table className="table table-light table-striped-columns">
        <thead>
          <tr>
            <th>Position</th>
            <th>Driver</th>
            <th>Best Lap</th>
            <th>Laps</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map((driver, index) => (
            <tr
              key={driver.driver_number}
              role="button"
              onClick={() =>
                navigate(
                  `/race-results/${sessionKey}/${encodeURIComponent(sessionName)}/${driver.driver_number}`
                )
              }
            >
              <td>{index + 1}</td>
              <td>{driver.driver_name}</td>
              <td>{driver.best_lap ? lapToMinFormat(driver.best_lap.lap_duration) : "N/A"}</td>
              <td>{driver.completed_laps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinalRaceClassification;
