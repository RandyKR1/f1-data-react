import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    SESSION_ROUTES,
    buildDriverMap,
    getDriverName,
    getBestLapsByDriver,
    sortByPosition,
    getResultStatus,
    lapToMinFormat,
    formatRaceTime,
    formatGap,
} from "../../utilities";

const formatSector = (seconds) => (seconds == null ? "–" : seconds.toFixed(3));

// Qualifying duration is [Q1, Q2, Q3]
const qualifyingColumn = (index) => ({
    header: `Q${index + 1}`,
    cell: (r) => (Array.isArray(r.duration) ? lapToMinFormat(r.duration[index]) : "–"),
});

const lapsColumn = { header: "Laps", cell: (r) => r.number_of_laps ?? "–" };

// Columns after Position + Driver, per session type. `best` is the driver's
// fastest complete lap from the laps endpoint (for sector times).
const COLUMNS = {
    Practice: [
        { header: "Best Lap", cell: (r) => lapToMinFormat(r.duration) },
        { header: "Gap", cell: (r) => formatGap(r.gap_to_leader) },
        lapsColumn,
        { header: "S1", cell: (r, best) => formatSector(best?.duration_sector_1) },
        { header: "S2", cell: (r, best) => formatSector(best?.duration_sector_2) },
        { header: "S3", cell: (r, best) => formatSector(best?.duration_sector_3) },
    ],
    Qualifying: [qualifyingColumn(0), qualifyingColumn(1), qualifyingColumn(2), lapsColumn],
    Race: [
        {
            header: "Time / Status",
            cell: (r) =>
                getResultStatus(r) ??
                (r.position === 1 ? formatRaceTime(r.duration) : formatGap(r.gap_to_leader)),
        },
        lapsColumn,
    ],
};

const pointsColumn = { header: "Points", cell: (r) => r.points ?? 0 };

/**
 * Session classification table.
 * @param type - "Practice" | "Qualifying" | "Race" (OpenF1 session_type)
 * @param results - session_result rows (or fallback rows in the same shape)
 * @param isOfficial - false when results were built from live position data
 */
const ClassificationTable = ({ type, results, isOfficial, laps, drivers, sessionKey, sessionName }) => {
    const navigate = useNavigate();
    const driverMap = useMemo(() => buildDriverMap(drivers), [drivers]);
    const bestLaps = useMemo(() => getBestLapsByDriver(laps), [laps]);
    const rows = useMemo(() => sortByPosition(results), [results]);

    if (!rows.length) {
        return <p className="text-center">No classification available for this session yet.</p>;
    }

    // Fallback qualifying rows only have one best lap, not Q1/Q2/Q3
    let columns = type === "Qualifying" && !isOfficial ? COLUMNS.Practice : COLUMNS[type];
    if (type === "Race" && rows.some((r) => r.points != null)) {
        columns = [...columns, pointsColumn];
    }

    return (
        <div className="col-12">
            <table className="table table-light table-striped table-hover align-middle">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Driver</th>
                        {columns.map((col) => <th key={col.header}>{col.header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr
                            key={r.driver_number}
                            role="button"
                            onClick={() =>
                                navigate(
                                    `/${SESSION_ROUTES[type]}/${sessionKey}/${encodeURIComponent(sessionName)}/${r.driver_number}`
                                )
                            }
                        >
                            <td>{r.position ?? "–"}</td>
                            <td>{getDriverName(driverMap, r.driver_number)}</td>
                            {columns.map((col) => (
                                <td key={col.header}>{col.cell(r, bestLaps.get(r.driver_number))}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ClassificationTable;
