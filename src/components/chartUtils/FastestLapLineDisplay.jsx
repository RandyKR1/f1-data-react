import { useMemo } from "react";
import {
    ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";
import { lapToMinFormat } from "../../utilities";

const SECTORS = [
    ["Sector 1", "duration_sector_1"],
    ["Sector 2", "duration_sector_2"],
    ["Sector 3", "duration_sector_3"],
];

/**
 * Each selected driver's fastest complete lap, broken into sectors:
 * bars = sector time, line = running lap time.
 * @param bestLaps - Map of driver_number -> fastest complete lap
 * @param selected - driver numbers to draw
 * @param styles - Map of driver_number -> { name, color, secondary }
 */
const FastestLapLineDisplay = ({ bestLaps, selected, styles }) => {
    const charted = useMemo(
        () => selected.filter((num) => bestLaps.has(num) && styles.has(num)),
        [selected, bestLaps, styles]
    );
    const missing = selected.filter((num) => !bestLaps.has(num) && styles.has(num));

    const chartData = useMemo(() => {
        const rows = [{ sector: "Start" }, ...SECTORS.map(([label]) => ({ sector: label }))];
        for (const num of charted) {
            const lap = bestLaps.get(num);
            let cumulativeMs = 0;
            rows[0][`${num}_cumulative`] = 0;
            SECTORS.forEach(([, field], i) => {
                // Add in whole milliseconds to avoid floating-point drift
                cumulativeMs += Math.round(lap[field] * 1000);
                rows[i + 1][`${num}_bar`] = lap[field];
                rows[i + 1][`${num}_cumulative`] = cumulativeMs / 1000;
            });
        }
        return rows;
    }, [bestLaps, charted]);

    return (
        <div>
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis tickFormatter={lapToMinFormat} />
                    <Tooltip formatter={lapToMinFormat} />
                    <Legend verticalAlign="bottom" />

                    {/* Bars - sector durations */}
                    {charted.map((num) => {
                        const style = styles.get(num);
                        return (
                            <Bar
                                key={`${num}_bar`}
                                dataKey={`${num}_bar`}
                                fill={style.color}
                                fillOpacity={style.secondary ? 0.55 : 1}
                                name={`${style.name} Sector`}
                                isAnimationActive={false}
                            />
                        );
                    })}

                    {/* Lines - cumulative lap time */}
                    {charted.map((num) => {
                        const style = styles.get(num);
                        return (
                            <Line
                                key={`${num}_cumulative`}
                                type="monotone"
                                dataKey={`${num}_cumulative`}
                                stroke={style.color}
                                strokeDasharray={style.secondary ? "6 3" : undefined}
                                name={`${style.name} Lap`}
                                isAnimationActive={false}
                            />
                        );
                    })}
                </ComposedChart>
            </ResponsiveContainer>
            {missing.length > 0 && (
                <p className="small text-muted text-center">
                    No complete timed lap for: {missing.map((num) => styles.get(num).name).join(", ")}
                </p>
            )}
        </div>
    );
};

export default FastestLapLineDisplay;
