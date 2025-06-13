import React, { useState, useEffect } from "react";
import DriverSelector from "../chartUtils/DriverSelector";
import CompareToggle from "../chartUtils/CompareToggle";
import LineVisibilityToggle from "../chartUtils/LineVisabilityToggle";
import SessionLapsLineDisplay from "../chartUtils/SessionLapsLineDisplay";
import FastestLapLineDisplay from "../chartUtils/FastestLapLineDisplay";
import { useLocation } from "react-router-dom";

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

    const lapsWithDriverNames = laps.map((lap) => {
        const driver = drivers.find(d => d.driver_number === lap.driver_number);
        return {
            ...lap,
            driver_name: driver ? driver.last_name : lap.driver_number,
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
        (lap) => lap.driver_name === selectedDriver1 && !lap.is_pit_out_lap);
    const driver2Laps = lapsWithDriverNames.filter(
        (lap) => lap.driver_name === selectedDriver2 && !lap.is_pit_out_lap);


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

    const location = useLocation();
    const isQualifying = location.pathname.includes("qualy-results");


    return (
        <div>
            <DriverSelector
                id="driverSelect1"
                label="Select Driver 1:"
                drivers={driverNames}
                selectedDriver={selectedDriver1}
                onChange={setSelectedDriver1}
                disabledDriver={compareMode ? selectedDriver2 : null} />

            {compareMode && (
                <DriverSelector
                    id="driverSelect2"
                    label="Select Driver 2:"
                    drivers={driverNames}
                    selectedDriver={selectedDriver2}
                    onChange={setSelectedDriver2}
                    disabledDriver={selectedDriver1}
                />
            )}

            <CompareToggle
                compareMode={compareMode}
                onToggle={() => setCompareMode((prev) => !prev)}
            />

            <hr />

            <LineVisibilityToggle
                visibleLines={visibleLines}
                onToggle={handleToggleLine} />

            {isQualifying ? (
                <FastestLapLineDisplay
                    laps={laps}
                    drivers={drivers}
                    visibleLines={visibleLines}
                    compareMode={compareMode}
                    driver1={selectedDriver1}
                    driver2={selectedDriver2}
                />
            ) : (
                combinedData.length > 0 ? (
                    <SessionLapsLineDisplay
                        data={combinedData}
                        visibleLines={visibleLines}
                        compareMode={compareMode}
                        driver1={selectedDriver1}
                        driver2={selectedDriver2}
                    />
                ) : (
                    <p>Select drivers to preview lap data!</p>
                )
            )}
        </div>
    )
};


export default LapTimeChart;
