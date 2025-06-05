import React, {useEffect, useState} from "react";
import { getLaps, getDrivers } from "../../api";
import { getMinBy, lapToMinFormat, mapDriverNames, groupByDriverName } from "../../utilities";

const FastestLap = ({sessionKey}) => {
    const [laps, setLaps] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLaps = async () => {
            if (!sessionKey) return;

            const data = await getLaps(sessionKey);
            // console.log("Lap Data", data)
            setLaps(data);
            setLoading(false)
        }

        fetchLaps();
    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchDrivers = async () => {
            const data = await getDrivers(sessionKey);
            setDrivers(data);
            // console.log(data);
            setLoading(false);
        };
    
        fetchDrivers();
    }, [sessionKey])


    if(loading || !laps.length || !drivers.length){
        return <p>Loading Lap Data...</p>
    }

    const addNameToLaps = mapDriverNames(laps, drivers)
    const lapsWithName = groupByDriverName(addNameToLaps)
    console.log("Laps By Name", lapsWithName)


    //find fastest lap 
    const fullLaps = laps.filter(lap => 
        lap.duration_sector_1 != null &&
        lap.duration_sector_2 != null &&
        lap.duration_sector_3 != null
    )
    const fastestLap = getMinBy(fullLaps, "lap_duration")
    const formattedFastestLap = lapToMinFormat(fastestLap.lap_duration);
    // console.log("Fastest Lap", formattedFastestLap)

    return(
        <div>
            <strong>Fastest Lap</strong> 
            <ul>
                <li>Driver: {fastestLap.driver_name || fastestLap.driver_number}</li>
                <li>Lap Time: {formattedFastestLap}</li>
                <li>Sector 1: {fastestLap.duration_sector_1}</li>
                <li>Sector 2: {fastestLap.duration_sector_2}</li>
                <li>Sector 3: {fastestLap.duration_sector_3}</li>
            </ul>    
            {/* <h1>Lap Information</h1>

            <ul>
                {laps.map((lap) => 
                    <li key={`${lap.driver_number}-${lap.lap_number}`}>
                        {`Lap ${lap.lap_number}, Sector 1: ${lap.duration_sector_1}, Sector 2: ${lap.duration_sector_2}, Sector 3: ${lap.duration_sector_3}` || `Lap number ${lap.lap_number}`}
                    </li>
                )}
            </ul> */}
        </div>
    )
}

export default FastestLap;
