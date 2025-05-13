import { getDrivers } from "../api";
import { filterDupes } from "../utilities";
import React, { useEffect, useState } from "react";

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDrivers = async () => {
            const data = await getDrivers();
            setDrivers(data);
            setLoading(false);
        };
    
        fetchDrivers();
    }, [])


    const filteredDriverLineup = filterDupes(drivers, "broadcast_name");




    if(loading){
        return <p>Loading Drivers...</p>
    }

    return(
        <div>
            <h1>Drivers List below</h1>

            <ul>
                {filteredDriverLineup.map((driver) => 
                    <li key={driver.broadcast_name}>
                        {driver.broadcast_name || `Driver number ${driver.driver_number}`}
                    </li>
                )}
            </ul>
        </div>
    )
}

export default Drivers;