import React, { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const LapTimeChart = ({ drivers = [], laps = [] }) => {
    const [selectedDriver1, setSelectedDriver1] = useState("");
    const [selectedDriver2, setSelectedDriver2] = useState("");

    const lapsWithDriverNames = laps.map(lap => {
        const driver = drivers.find(d => d.driver_number === lap.driver_number);
        return {
            ...lap,
            driver_name: driver ? driver.last_name : lap.driver_number
        }
    })

    // Set initial selected driver once drivers data is loaded
    useEffect(() => {
        const uniqueDrivers = [
            ...new Set(
                lapsWithDriverNames
                    .filter((lap) => !lap.is_pit_out_lap && lap.driver_name)
                    .map((lap) => lap.driver_name)
            ),
        ];
        if (uniqueDrivers.length > 0) {
            setSelectedDriver1(uniqueDrivers[0]);
            setSelectedDriver2(uniqueDrivers[1] || uniqueDrivers[0]); // fallback if only one driver
        }
    }, [lapsWithDriverNames]);

    if (!drivers.length) return <p>No drivers found</p>;

    // Filter laps for selected drivers
    const driver1Laps = lapsWithDriverNames.filter(
        (lap) => lap.driver_name === selectedDriver1 && !lap.is_pit_out_lap
    );
    const driver2Laps = lapsWithDriverNames.filter(
        (lap) => lap.driver_name === selectedDriver2 && !lap.is_pit_out_lap
    );

    // Create maps for quick lookup by lap number
    const driver1Map = new Map(driver1Laps.map((lap) => [lap.lap_number, lap]));
    const driver2Map = new Map(driver2Laps.map((lap) => [lap.lap_number, lap]));

    // Get all lap numbers for both drivers
    const allLapNumbers = Array.from(
        new Set([...driver1Map.keys(), ...driver2Map.keys()])
    ).sort((a, b) => a - b);

    // Combine lap data for both drivers keyed by lap number
    const combinedData = allLapNumbers.map((lapNumber) => ({
        lapNumber,
        lapDuration1: driver1Map.get(lapNumber)?.lap_duration,
        sector1_1: driver1Map.get(lapNumber)?.duration_sector_1,
        sector2_1: driver1Map.get(lapNumber)?.duration_sector_2,
        sector3_1: driver1Map.get(lapNumber)?.duration_sector_3,

        lapDuration2: driver2Map.get(lapNumber)?.lap_duration,
        sector1_2: driver2Map.get(lapNumber)?.duration_sector_1,
        sector2_2: driver2Map.get(lapNumber)?.duration_sector_2,
        sector3_2: driver2Map.get(lapNumber)?.duration_sector_3,
    }));

    const driverNames = [
        ...new Set(lapsWithDriverNames.map((d) => d.driver_name)),
    ].sort();


    // console.log("DL:", driverLaps)
    // console.log("Drivers:", drivers)
    // console.log("Laps:", laps)

    return (
        <div>
            <div className="mb-3">
                <label htmlFor="driverSelect1" className="form-label">
                    Select Driver 1:
                </label>
                <select
                    id="driverSelect1"
                    className="form-select"
                    value={selectedDriver1}
                    onChange={(e) => {
                        // Prevent selecting same driver in both selects
                        if (e.target.value !== selectedDriver2) {
                            setSelectedDriver1(e.target.value);
                        }
                    }}
                >
                    {driverNames.map((name) => (
                        <option
                            key={name}
                            value={name}
                            disabled={name === selectedDriver2}
                        >
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-3">
                <label htmlFor="driverSelect2" className="form-label">
                    Select Driver 2:
                </label>
                <select
                    id="driverSelect2"
                    className="form-select"
                    value={selectedDriver2}
                    onChange={(e) => {
                        if (e.target.value !== selectedDriver1) {
                            setSelectedDriver2(e.target.value);
                        }
                    }}
                >
                    {driverNames.map((name) => (
                        <option
                            key={name}
                            value={name}
                            disabled={name === selectedDriver1}
                        >
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            {combinedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                        data={combinedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="lapNumber"
                            label={{ value: "Lap", position: "insideBottomRight", offset: -5 }}
                        />
                        <YAxis
                            label={{ value: "Time (seconds)", angle: -90, position: "insideLeft" }}
                            domain={["dataMin - 2", "dataMax + 2"]}
                        />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />

                        {/* Driver 1 Areas */}
                        <Area
                            type="monotone"
                            dataKey="lapDuration1"
                            stroke="#8884d8"
                            fill="#8884d8"
                            name={`${selectedDriver1} Lap Time`}
                            dot
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="sector1_1"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            name={`${selectedDriver1} Sector 1`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />
                        <Area
                            type="monotone"
                            dataKey="sector2_1"
                            stroke="#ffc658"
                            fill="#ffc658"
                            name={`${selectedDriver1} Sector 2`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />
                        <Area
                            type="monotone"
                            dataKey="sector3_1"
                            stroke="#ff7300"
                            fill="#ff7300"
                            name={`${selectedDriver1} Sector 3`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />

                        {/* Driver 2 Areas */}
                        <Area
                            type="monotone"
                            dataKey="lapDuration2"
                            stroke="#413ea0"
                            fill="#413ea0"
                            name={`${selectedDriver2} Lap Time`}
                            dot
                            connectNulls
                        />
                        <Area
                            type="monotone"
                            dataKey="sector1_2"
                            stroke="#008000"
                            fill="#008000"
                            name={`${selectedDriver2} Sector 1`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />
                        <Area
                            type="monotone"
                            dataKey="sector2_2"
                            stroke="#ff6347"
                            fill="#ff6347"
                            name={`${selectedDriver2} Sector 2`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />
                        <Area
                            type="monotone"
                            dataKey="sector3_2"
                            stroke="#ffa500"
                            fill="#ffa500"
                            name={`${selectedDriver2} Sector 3`}
                            dot={false}
                            connectNulls
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <p>Select drivers to preview lap data!</p>
            )}
        </div>
    );
};

export default LapTimeChart;
