import { getDrivers } from "../../api";
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

    if(loading || !drivers.length){
        return <p>Loading Drivers...</p>
    }

    return(
        <div>
        </div>
    )
}

export default Drivers;