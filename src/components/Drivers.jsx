import { getDrivers } from "../api";
import { filterDupes } from "../utilities";
import React, { useEffect, useState } from "react";

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        if (!sessionKey) return;

        const fetchDrivers = async () => {
            const data = await getDrivers(sessionKey);
            setDrivers(data);
            console.log(data);
            setLoading(false);
        };
    
        fetchDrivers();
    }, [sessionKey])


    const filteredDriverLineup = filterDupes(drivers, "broadcast_name");




    if(loading){
        return <p>Loading Drivers...</p>
    }

    return(
        <div>
        </div>
    )
}

export default Drivers;