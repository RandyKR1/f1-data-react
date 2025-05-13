import React, {useEffect, useState} from "react";
import { getLocation } from "../api";
import { filterDupes } from "../utilities";

const Location = () => {
    const [location, setLocation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        const fetchLocation = async () => {
            if (!sessionKey) return;

            const data = await getLocation();
            setLocation(data);
            setLoading(false);
        };

    fetchLocation();
    }, [sessionKey]);

    const filteredLocations = filterDupes(location, "session_key")

    if(loading){
        return <p>Loading locations...</p>
    }

    return(
        <div>
            <h1>Locations</h1>

            <ul>
                {filteredLocations.map((loc) => 
                    <li key={loc.session_key}>
                        {`Lat: ${loc.latitude}, Long: ${loc.longitude}, Session Key: ${loc.session_key}`}
                    </li>
                )}

            </ul>
        </div>
    )}

export default Location;