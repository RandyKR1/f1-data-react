import React, {useEffect, useState} from "react";
import { filterDupes } from "../utilities";
import { getLaps } from "../api";

const Laps = () => {
    const [laps, setLaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        const fetchLaps = async () => {
            if (!sessionKey) return;

            const data = await getLaps(sessionKey);
            console.log(data)
            setLaps(data);
            setLoading(false)
        }

        fetchLaps();
    }, [setSessionKey]);

    const filteredLaps = filterDupes(laps, "lap_number")

    if(loading){
        return <p>Loading Lap Data...</p>
    }

    return(
        <div>
            <h1>Lap Information below</h1>

            <ul>
                {filteredLaps.map((lap) => 
                    <li key={lap.lap_number}>
                        {`Lap ${lap.lap_number}, Sector 1: ${lap.duration_sector_1}, Sector 2: ${lap.duration_sector_2}, Sector 3: ${lap.duration_sector_3}` || `Lap number ${lap.lap_number}`}
                    </li>
                )}
            </ul>
        </div>
    )
}

export default Laps;
