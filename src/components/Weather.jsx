import React, {useState, useEffect} from "react";
import { getWeather } from "../api";
import { getMaxBy } from "../utilities";

const Weather = ({sessionKey}) => {
    const [weather, setWeather] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchWeather = async () => {
            const data = await getWeather(sessionKey);
            setWeather(data);
            setLoading(false);
        }
        fetchWeather();
    }, [sessionKey]);

    console.log("Weather Data:", weather)

        
    if(loading){
        return <p>Loading Weather Data...</p>
    }
   
    const maxTemp = getMaxBy(weather, "air_temperature");

    return(
        <div>
            {weather.map((w, index) =>
                <p key={index}>
                    <strong>Max Temp: {maxTemp?.air_temperature}</strong> <br/> 
                </p>)} 
                
                {/* I want to display the highs and lows or averages of: 
                air_temperature
                humidity
                wind_speed
                track_temperature */}

               
        </div>
    )
}

export default Weather;