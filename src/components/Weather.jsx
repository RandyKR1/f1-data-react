import React, {useState, useEffect} from "react";
import { getWeather } from "../api";

const Weather = ({sessionKey}) => {
    const [weather, setWeather] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchWeather = async () => {
            const data = await getWeather(sessionKey);
            console.log("Weather Data:", data)
            setWeather(data);
            setLoading(false);
        }
        fetchWeather();
    }, [sessionKey]);

        
    if(loading){
        return <p>Loading Weather Data...</p>
    }
   

    return(
        <div>
            {/* {weather.map((w, index) =>
                <p key={index}>
                    <strong>Driver: {w.driver_number}</strong> <br/> 
                    <a href={w.recording_url} target="_blank" rel="noreferrer">Listen to Radio</a>
                </p>)} 
                
                I want to display the highs and lows or averages of: 
                air_temperature
                humidity
                wind_speed
                track_temperature

                */}
        </div>
    )
}

export default Weather;