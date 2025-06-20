import { useNavigate } from "react-router-dom";
import React from "react";
import { lapToMinFormat, mapDriverNames, groupByDriverName } from "../../utilities";

const FinalClassificationTable = ({ laps, drivers, sessionKey, sessionName, positionInfo }) => {
  if (!laps?.length || !drivers?.length || !positionInfo?.length) return null;

  const navigate = useNavigate();

  const lapsWithNames = mapDriverNames(laps, drivers);
  const positionWithNames = mapDriverNames(positionInfo, drivers);
  const positionsByName = groupByDriverName(positionWithNames);

  // Group all laps by driver_number
  const lapsByDriver = lapsWithNames.reduce((acc, lap) => {
    if (!acc[lap.driver_number]) acc[lap.driver_number] = [];
    acc[lap.driver_number].push(lap);
    return acc;
  }, {});

  // Build final result table using final position only
  const finalResults = Object.entries(positionsByName).map(([driverName, entries]) => {
    const finalEntry = entries[entries.length - 1]; // last known position is final
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
      best_lap: bestLap
    };
  });

  const sortedResults = finalResults.sort((a, b) => a.final_position - b.final_position);

  return (
    <div className="col-xs-12">
      <table className="table table-light table-striped-columns">
        <thead>
          <tr>
            <th>Position</th>
            <th>Driver</th>
            <th>Best Lap</th>
            <th>Lap #</th>
            <th>Sector 1</th>
            <th>Sector 2</th>
            <th>Sector 3</th>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map((driver) => (
            <tr
              key={driver.driver_number}
              role="button"
              onClick={() =>
                navigate(
                  `/practice-results/${sessionKey}/${encodeURIComponent(sessionName)}/${driver.driver_number}`
                )
              }
            >
              <td>{driver.final_position}</td>
              <td>{driver.driver_name}</td>
              <td>{driver.best_lap ? lapToMinFormat(driver.best_lap.lap_duration) : "N/A"}</td>
              <td>{driver.best_lap?.lap_number ?? "–"}</td>
              <td>{driver.best_lap?.duration_sector_1 ?? "–"}</td>
              <td>{driver.best_lap?.duration_sector_2 ?? "–"}</td>
              <td>{driver.best_lap?.duration_sector_3 ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinalClassificationTable;
