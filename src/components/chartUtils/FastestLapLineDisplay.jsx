import { mapDriverNames, lapToMinFormat } from "../../utilities";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";

const FastestLapLineDisplay = ({ laps, drivers, visibleLines, compareMode, driver1, driver2}) => {
    const lapsWithNames = mapDriverNames(laps, drivers);

    const fullLaps = lapsWithNames.filter(lap =>
        lap.lap_duration != null &&
        lap.duration_sector_1 != null &&
        lap.duration_sector_2 != null &&
        lap.duration_sector_3 != null
    )

    const fastestLaps = fullLaps.reduce((acc, lap) => {
        const name = lap.driver_name;
        if (!acc[name] || lap.lap_duration < acc[name].lap_duration) {
            acc[name] = lap;
        }
        return acc;
    }, {});

    const lap1 = fastestLaps[driver1];
    const lap2 = compareMode ? fastestLaps[driver2] : null;

    const chartData = [
        {
            name: driver1,
            lapTime: lap1?.lap_duration,
            sector1: lap1?.duration_sector_1,
            sector2: lap1?.duration_sector_2,
            sector3: lap1?.duration_sector_3,
        },
    ];

    if (compareMode && lap2) {
        chartData.push({
            name: driver2,
            lapTime: lap2?.lap_duration,
            sector1: lap2?.duration_sector_1,
            sector2: lap2?.duration_sector_2,
            sector3: lap2?.duration_sector_3,
        });
    }

    // console.log("Chart Data:", chartData)
    // console.log("Fastest Laps:", fastestLaps)


    return (
        <div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <XAxis dataKey="name" />
                    <YAxis
                        label={{ value: "Time (s)", angle: -90, position: "insideLeft" }}
                        tickFormatter={lapToMinFormat}
                    />
                    <Tooltip formatter={lapToMinFormat} />
                    <Legend verticalAlign="top" height={36} />

                    {visibleLines.lapTime && (
                        <Line
                            type="monotone"
                            dataKey="lapTime"
                            stackId="1"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            name="Lap Time"
                        />
                    )}
                    {visibleLines.sector1 && (
                        <Line
                            type="monotone"
                            dataKey="sector1"
                            stackId="1"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            name="Sector 1"
                        />
                    )}
                    {visibleLines.sector2 && (
                        <Line
                            type="monotone"
                            dataKey="sector2"
                            stackId="1"
                            stroke="#ffc658"
                            fill="#ffc658"
                            name="Sector 2"
                        />
                    )}
                    {visibleLines.sector3 && (
                        <Line
                            type="monotone"
                            dataKey="sector3"
                            stackId="1"
                            stroke="#ff7300"
                            fill="#ff7300"
                            name="Sector 3"
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

        </div>
    )
}

export default FastestLapLineDisplay