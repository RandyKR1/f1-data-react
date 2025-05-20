import React, {useState, useEffect} from "react";
import { getWeather } from "../api";
import { getMaxBy, toFahrenheit, toMPH } from "../utilities";

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

    console.log("Weather Data:", weather[0])

        
    if(loading){
        return <p>Loading Weather Data...</p>
    }
   
    const maxAirTempCel = getMaxBy(weather, "air_temperature")
        const maxAirTempFar = toFahrenheit(maxAirTempCel.air_temperature)
    const maxTrackTempCel = getMaxBy(weather, "track_temperature");
        const maxTrackTempFar = toFahrenheit(maxTrackTempCel.track_temperature)
    const maxWindSpeed = getMaxBy(weather, "wind_speed")
        const maxWindSpeedMPH = toMPH(maxWindSpeed.wind_speed);

    console.log("Max Air Temp Celcius:", maxAirTempCel.air_temperature)
    console.log("Max Air Temp Farenheit:", maxAirTempFar)
    console.log("Max Track Temp:", maxTrackTempCel.air_temperature)
    console.log("Max Wind Speed:", maxWindSpeedMPH)
    

    return(
        <div>
            <p><strong>Max Air Temp:</strong> {maxAirTempCel?.air_temperature}°C / {maxAirTempFar}°F</p>
            <p><strong>Max Track Temp:</strong> {maxTrackTempCel?.wind_speed}°C / {maxTrackTempFar}°F</p>
            <p><strong>Max Wind Speed:</strong> {maxWindSpeed?.wind_speed}°C / {maxWindSpeedMPH}°F</p>
                
                {/* I want to display the highs and lows or averages of: 
                air_temperature
                humidity
                wind_speed
                track_temperature */}

               
        </div>
    )
}

export default Weather;