import { mapDriverNames, lapToMinFormat } from "../../utilities";
import {
    ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";

const FastestLapLineDisplay = ({ laps, drivers, visibleLines, compareMode, driver1, driver2 }) => {
    const lapsWithNames = mapDriverNames(laps, drivers);

    const fullLaps = lapsWithNames.filter(lap =>
        lap.lap_duration != null &&
        lap.duration_sector_1 != null &&
        lap.duration_sector_2 != null &&
        lap.duration_sector_3 != null
    );

    const fastestLaps = fullLaps.reduce((acc, lap) => {
        const name = lap.driver_name;
        if (!acc[name] || lap.lap_duration < acc[name].lap_duration) {
            acc[name] = lap;
        }
        return acc;
    }, {});

    const lap1 = fastestLaps[driver1];
    const lap2 = compareMode ? fastestLaps[driver2] : null;

    const chartData = [];

    if (lap1) {

        const s1 = lap1.duration_sector_1;
        const s2 = lap1.duration_sector_2;
        const s3 = lap1.duration_sector_3;
        const cumulative_s1 = s1;
        const cumulative_s2 = s1 + s2;
        const cumulative_s3 = s1 + s2 + s3;

        const s1_2 = lap2?.duration_sector_1 ?? 0;
        const s2_2 = lap2?.duration_sector_2 ?? 0;
        const s3_2 = lap2?.duration_sector_3 ?? 0;
        const cumulative2_s1 = s1_2;
        const cumulative2_s2 = s1_2 + s2_2;
        const cumulative2_s3 = s1_2 + s2_2 + s3_2;

        chartData.push(
            {
                sector: "Start",
                [`${driver1}_cumulative`]: 0,
                ...(compareMode && lap2 && { [`${driver2}_cumulative`]: 0 }),
            },
            {
                sector: "Sector 1",
                [`${driver1}_cumulative`]: cumulative_s1,
                [`${driver1}_bar`]: s1,
                ...(compareMode && lap2 && {
                    [`${driver2}_cumulative`]: cumulative2_s1,
                    [`${driver2}_bar`]: s1_2
                }),
            },
            {
                sector: "Sector 2",
                [`${driver1}_cumulative`]: cumulative_s2,
                [`${driver1}_bar`]: s2,
                ...(compareMode && lap2 && {
                    [`${driver2}_cumulative`]: cumulative2_s2,
                    [`${driver2}_bar`]: s2_2
                }),
            },
            {
                sector: "Sector 3",
                [`${driver1}_cumulative`]: cumulative_s3,
                [`${driver1}_bar`]: s3,
                ...(compareMode && lap2 && {
                    [`${driver2}_cumulative`]: cumulative2_s3,
                    [`${driver2}_bar`]: s3_2
                }),
            }
        );
    }

    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis
                        label={{ value: "", angle: -90, position: "insideLeft" }}
                        tickFormatter={lapToMinFormat}
                    />
                    <Tooltip formatter={lapToMinFormat} />
                    <Legend verticalAlign="top" height={36} />

                    {/* Bars - sector durations */}
                    {visibleLines.lapTime && (
                        <Bar dataKey={`${driver1}_bar`} fill="#82ca9d" name={`${driver1} Sector Time`} />
                    )}
                    {compareMode && visibleLines.lapTime && (
                        <Bar dataKey={`${driver2}_bar`} fill="#ff7300" name={`${driver2} Sector Time`} />
                    )}

                    {/* Lines - cumulative lap time */}
                    {visibleLines.lapTime && (
                        <Line
                            type="monotone"
                            dataKey={`${driver1}_cumulative`}
                            stroke="#2f4f4f"
                            name={`${driver1} Cumulative Lap`}
                        />
                    )}
                    {compareMode && visibleLines.lapTime && (
                        <Line
                            type="monotone"
                            dataKey={`${driver2}_cumulative`}
                            stroke="#d62728"
                            name={`${driver2} Cumulative Lap`}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FastestLapLineDisplay;
