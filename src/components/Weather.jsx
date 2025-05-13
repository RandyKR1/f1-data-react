import React, {useState, useEffect} from "react";
import { getWeather } from "../api";
import { filterDupes } from "../utilities";

const Weather = () => {
    const [weather, setWeather] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchWeather = async () => {
            const data = await getWeather(session_key);
            setWeather(data);
            setLoading(false);
        }
        fetchWeather();

    }, [session_key]);


    if(loading){
        return <p>Loading Weather Data...</p>
    }

    const filteredTeamRadio = filterDupes(weather, "session_key");

    return(
        <div>
        </div>
    )
}

export default Weather;