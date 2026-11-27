import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DriverPicker from "../chartUtils/DriverPicker";
import LineVisibilityToggle from "../chartUtils/LineVisibilityToggle";
import SessionLapsLineDisplay from "../chartUtils/SessionLapsLineDisplay";
import FastestLapLineDisplay from "../chartUtils/FastestLapLineDisplay";
import { getTeamColor, getBestLapsByDriver } from "../../utilities";

// Above this many drivers, only one metric (lap or a sector) is drawn at a time
const MAX_DRIVERS_FOR_MULTI_METRIC = 3;
const LINE_KEYS = ["lapTime", "sector1", "sector2", "sector3"];
const METRIC_FIELDS = {
    lapTime: "lap_duration",
    sector1: "duration_sector_1",
    sector2: "duration_sector_2",
    sector3: "duration_sector_3",
};

/**
 * Lap time chart for any number of drivers in one session.
 * Parent pages mount this only after data has loaded, so initial
 * selection is computed once from props.
 * @param initialDrivers - driver numbers selected on first render
 */
const LapTimeChart = ({ drivers = [], laps = [], initialDrivers = [] }) => {
    const location = useLocation();
    const isQualifying = location.pathname.includes("qualy-results");

    // Only drivers who actually set laps can be charted
    const chartDrivers = useMemo(() => {
        const withLaps = new Set(laps.map((lap) => lap.driver_number));
        return drivers.filter((d) => withLaps.has(d.driver_number));
    }, [drivers, laps]);

    // Team colour per driver; the second driver of each team is marked
    // `secondary` so charts can dash/lighten them
    const driverStyles = useMemo(() => {
        const styles = new Map();
        const seenTeams = new Set();
        [...chartDrivers]
            .sort((a, b) => a.driver_number - b.driver_number)
            .forEach((d) => {
                styles.set(d.driver_number, {
                    name: d.last_name ?? `#${d.driver_number}`,
                    color: getTeamColor(d),
                    secondary: seenTeams.has(d.team_name),
                });
                seenTeams.add(d.team_name);
            });
        return styles;
    }, [chartDrivers]);

    const [selected, setSelected] = useState(() => {
        const valid = initialDrivers
            .map(Number)
            .filter((num) => chartDrivers.some((d) => d.driver_number === num));
        return valid.length ? valid : chartDrivers.slice(0, 2).map((d) => d.driver_number);
    });

    const [visibleLines, setVisibleLines] = useState({
        lapTime: true,
        sector1: false,
        sector2: false,
        sector3: false,
    });

    const manyDrivers = selected.length > MAX_DRIVERS_FOR_MULTI_METRIC;

    // With many drivers, keep only the first checked metric so the chart stays readable
    const effectiveLines = useMemo(() => {
        if (!manyDrivers) return visibleLines;
        const first = LINE_KEYS.find((key) => visibleLines[key]) ?? "lapTime";
        return Object.fromEntries(LINE_KEYS.map((key) => [key, key === first]));
    }, [visibleLines, manyDrivers]);

    const handleToggleLine = (key) => {
        setVisibleLines((prev) =>
            manyDrivers
                ? Object.fromEntries(LINE_KEYS.map((k) => [k, k === key]))
                : { ...prev, [key]: !prev[key] }
        );
    };

    // One row per lap: { lapNumber, "1_lapTime": 92.1, "1_sector1": 29.4, "44_lapTime": ... }
    // Pit out-laps are skipped because they distort the scale.
    const lapData = useMemo(() => {
        if (isQualifying) return [];
        const selectedSet = new Set(selected);
        const rows = new Map();
        for (const lap of laps) {
            if (lap.is_pit_out_lap || !selectedSet.has(lap.driver_number)) continue;
            const row = rows.get(lap.lap_number) ?? { lapNumber: lap.lap_number };
            for (const [key, field] of Object.entries(METRIC_FIELDS)) {
                row[`${lap.driver_number}_${key}`] = lap[field];
            }
            rows.set(lap.lap_number, row);
        }
        return [...rows.values()].sort((a, b) => a.lapNumber - b.lapNumber);
    }, [laps, selected, isQualifying]);

    const bestLaps = useMemo(
        () => (isQualifying ? getBestLapsByDriver(laps) : new Map()),
        [laps, isQualifying]
    );

    if (!laps.length) return <p className="text-center text-muted my-4">Lap data isn't available for this session.</p>;
    if (!chartDrivers.length) return <p>No lap data found for this session.</p>;

    return (
        <div>
            <DriverPicker
                drivers={chartDrivers}
                selected={selected}
                onChange={setSelected}
                styles={driverStyles}
            />

            <hr />

            {!isQualifying && (
                <>
                    <LineVisibilityToggle visibleLines={effectiveLines} onToggle={handleToggleLine} />
                    {manyDrivers && (
                        <p className="small text-muted">
                            Showing one metric at a time when more than {MAX_DRIVERS_FOR_MULTI_METRIC} drivers are selected.
                        </p>
                    )}
                </>
            )}

            {!selected.length ? (
                <p>Select at least one driver to see lap data.</p>
            ) : isQualifying ? (
                <FastestLapLineDisplay bestLaps={bestLaps} selected={selected} styles={driverStyles} />
            ) : (
                <SessionLapsLineDisplay
                    data={lapData}
                    selected={selected}
                    styles={driverStyles}
                    visibleLines={effectiveLines}
                />
            )}
        </div>
    );
};

export default LapTimeChart;
