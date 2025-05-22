import React, {useEffect, useState} from "react";
import { getLaps } from "../api";

const Laps = ({sessionKey}) => {
    const [laps, setLaps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLaps = async () => {
            if (!sessionKey) return;

            const data = await getLaps(sessionKey);
            console.log("Lap Data", data)
            setLaps(data);
            setLoading(false)
        }

        fetchLaps();
    }, [sessionKey]);


    if(loading || !laps.length){
        return <p>Loading Lap Data...</p>
    }

    return(
        <div>
            {/* <h1>Lap Information below</h1>

            <ul>
                {filteredLaps.map((lap) => 
                    <li key={lap.lap_number}>
                        {`Lap ${lap.lap_number}, Sector 1: ${lap.duration_sector_1}, Sector 2: ${lap.duration_sector_2}, Sector 3: ${lap.duration_sector_3}` || `Lap number ${lap.lap_number}`}
                    </li>
                )}
            </ul> */}
        </div>
    )
}

export default Laps;
