import React, { useState, useEffect } from "react";
import { lapToMinFormat, getMinBy } from "../../utilities";
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
    const [visibleLines, setVisibleLines] = useState({
        lapTime: true,
        sector1: false,
        sector2: false,
        sector3: false,
    });
    const [compareMode, setCompareMode] = useState(false);

    const lapsWithDriverNames = laps.map(lap => {
        const driver = drivers.find(d => d.driver_number === lap.driver_number);
        return {
            ...lap,
            driver_name: driver ? driver.last_name : lap.driver_number
        };
    });

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
            setSelectedDriver2(uniqueDrivers[1] || uniqueDrivers[0]);
        }
    }, []);

    if (!drivers.length) return <p>No drivers found</p>;

    const driver1Laps = lapsWithDriverNames.filter(
        (lap) => lap.driver_name === selectedDriver1 && !lap.is_pit_out_lap
    );
    const driver2Laps = lapsWithDriverNames.filter(
        (lap) => lap.driver_name === selectedDriver2 && !lap.is_pit_out_lap
    );

    // Always combine all laps, no fastest lap logic
    const driver1Map = new Map(driver1Laps.map((lap) => [lap.lap_number, lap]));
    const driver2Map = new Map(driver2Laps.map((lap) => [lap.lap_number, lap]));
    const allLapNumbers = Array.from(
        new Set([...driver1Map.keys(), ...driver2Map.keys()])
    ).sort((a, b) => a - b);

    const combinedData = allLapNumbers.map((lapNumber) => ({
        lapNumber,
        lapDuration1: driver1Map.get(lapNumber)?.lap_duration,
        sector1_1: driver1Map.get(lapNumber)?.duration_sector_1,
        sector2_1: driver1Map.get(lapNumber)?.duration_sector_2,
        sector3_1: driver1Map.get(lapNumber)?.duration_sector_3,

        lapDuration2: compareMode ? driver2Map.get(lapNumber)?.lap_duration : null,
        sector1_2: compareMode ? driver2Map.get(lapNumber)?.duration_sector_1 : null,
        sector2_2: compareMode ? driver2Map.get(lapNumber)?.duration_sector_2 : null,
        sector3_2: compareMode ? driver2Map.get(lapNumber)?.duration_sector_3 : null,
    }));

    const driverNames = [...new Set(lapsWithDriverNames.map((d) => d.driver_name))].sort();

    const handleToggleLine = (key) => {
        setVisibleLines((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div>
            <div className="mb-3">
                <label htmlFor="driverSelect1" className="form-label">Select Driver 1:</label>
                <select
                    id="driverSelect1"
                    className="form-select"
                    value={selectedDriver1}
                    onChange={(e) => {
                        if (e.target.value !== selectedDriver2) setSelectedDriver1(e.target.value);
                    }}
                >
                    {driverNames.map((name) => (
                        <option
                            key={name}
                            value={name}
                            disabled={name === selectedDriver2 && compareMode}
                        >
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            {compareMode && (
                <div className="mb-3">
                    <label htmlFor="driverSelect2" className="form-label">Select Driver 2:</label>
                    <select
                        id="driverSelect2"
                        className="form-select"
                        value={selectedDriver2}
                        onChange={(e) => {
                            if (e.target.value !== selectedDriver1) setSelectedDriver2(e.target.value);
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
            )}

            <div className="mb-3">
                <label>
                    <input
                        type="checkbox"
                        checked={compareMode}
                        onChange={() => setCompareMode(prev => !prev)}
                    />{" "}
                    Compare Two Drivers
                </label>
            </div>

            <hr />
            <div className="mb-3 d-flex gap-3 flex-wrap">
                {["lapTime", "sector1", "sector2", "sector3"].map((key) => (
                    <label key={key}>
                        <input
                            type="checkbox"
                            checked={visibleLines[key]}
                            onChange={() => handleToggleLine(key)}
                            className="me-1"
                        />
                        {key === "lapTime" ? "Lap Time" : `Sector ${key.slice(-1)}`}
                    </label>
                ))}
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
                            label={{ value: "Time", angle: -90, position: "insideLeft" }}
                            tickFormatter={lapToMinFormat}
                            domain={["dataMin - 2", "dataMax + 2"]}
                        />
                        <Tooltip formatter={(value) => lapToMinFormat(value)} />
                        <Legend verticalAlign="top" height={36} />

                        {/* Driver 1 */}
                        {visibleLines.lapTime && (
                            <Area
                                type="monotone"
                                dataKey="lapDuration1"
                                stroke="#8884d8"
                                fill="#8884d8"
                                name={`${selectedDriver1} Lap Time`}
                                dot
                                connectNulls
                            />
                        )}
                        {visibleLines.sector1 && (
                            <Area
                                type="monotone"
                                dataKey="sector1_1"
                                stroke="#82ca9d"
                                name={`${selectedDriver1} Sector 1`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}
                        {visibleLines.sector2 && (
                            <Area
                                type="monotone"
                                dataKey="sector2_1"
                                stroke="#ffc658"
                                name={`${selectedDriver1} Sector 2`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}
                        {visibleLines.sector3 && (
                            <Area
                                type="monotone"
                                dataKey="sector3_1"
                                stroke="#ff7300"
                                name={`${selectedDriver1} Sector 3`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}

                        {/* Driver 2 */}
                        {compareMode && visibleLines.lapTime && (
                            <Area
                                type="monotone"
                                dataKey="lapDuration2"
                                stroke="#413ea0"
                                fill="#413ea0"
                                name={`${selectedDriver2} Lap Time`}
                                dot
                                connectNulls
                            />
                        )}
                        {compareMode && visibleLines.sector1 && (
                            <Area
                                type="monotone"
                                dataKey="sector1_2"
                                stroke="#008000"
                                name={`${selectedDriver2} Sector 1`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}
                        {compareMode && visibleLines.sector2 && (
                            <Area
                                type="monotone"
                                dataKey="sector2_2"
                                stroke="#ff6347"
                                name={`${selectedDriver2} Sector 2`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}
                        {compareMode && visibleLines.sector3 && (
                            <Area
                                type="monotone"
                                dataKey="sector3_2"
                                stroke="#ffa500"
                                name={`${selectedDriver2} Sector 3`}
                                dot={false}
                                connectNulls
                                fillOpacity={0.3}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <p>Select drivers to preview lap data!</p>
            )}
        </div>
    );
};


export default LapTimeChart;
