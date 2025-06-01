import React, {useState, useEffect} from "react";
import { getWeather } from "../../api";
import { getMaxBy, getMinBy, getAverageBy, toFahrenheit, toMPH, getWindDirection, rainfall } from "../../utilities";

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

    // console.log("Weather Data:", weather)

        
    if (loading || !weather.length) {
        return <p>Loading Weather Data...</p>;
    }

    const minAirTempCel = getMinBy(weather, "air_temperature")
    const maxAirTempCel = getMaxBy(weather, "air_temperature")
        const maxAirTempFar = toFahrenheit(maxAirTempCel.air_temperature)
        const minAirTempFar = toFahrenheit(minAirTempCel.air_temperature)

    const minTrackTempCel = getMinBy(weather, "track_temperature");    
    const maxTrackTempCel = getMaxBy(weather, "track_temperature");
        const minTrackTempFar = toFahrenheit(minTrackTempCel.track_temperature)
        const maxTrackTempFar = toFahrenheit(maxTrackTempCel.track_temperature)

    const maxWindSpeed = getMaxBy(weather, "wind_speed")
        const maxWindSpeedMPH = toMPH(maxWindSpeed.wind_speed);
        const windDirection = getWindDirection(maxWindSpeed.wind_direction)

    const humidity = getAverageBy(weather, "humidity");

    const rain = rainfall(weather, "rainfall")

    // console.log("Max Air Temp Celcius:", maxAirTempCel.air_temperature)
    // console.log("Max Air Temp Farenheit:", maxAirTempFar)
    // console.log("Max Track Temp:", maxTrackTempCel.air_temperature)
    // console.log("Max Wind Speed:", maxWindSpeedMPH)
    // console.log("Rainfall:", rain)
    

    return(
        <div>
            <p>Air Temp High: {maxAirTempCel?.air_temperature}°C / {maxAirTempFar}°F</p>
            <p>Air Temp Low: {minAirTempCel?.air_temperature}°C / {minAirTempFar}°F</p>
            <p>Track Temp High: {maxTrackTempCel?.track_temperature}°C / {maxTrackTempFar}°F</p>
            <p>Track Temp Low: {minTrackTempCel?.track_temperature}°C / {minTrackTempFar}°F</p>
            <p>Max Wind Speed: {maxWindSpeed?.wind_speed} KPH / {maxWindSpeedMPH} MPH</p>
            <p>Wind Direction: {windDirection}</p>
            <p>Humidity: {humidity}%</p>
            <p>Rain During Session?: {rain}</p>     
        </div>
    )
}

export default Weather;