import React, { useState, useEffect } from "react";
import { getWeather } from "../../api";
import { getMaxBy, getMinBy, getAverageBy, toFahrenheit, toMPH, getWindDirection, rainfall } from "../../utilities";

const Weather = ({ sessionKey }) => {
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


    return (
        <div className="container mb-5 ">
            <div className="row justify-content-center">

                <div className="col-md-3 col-12 text-center mb-2">
                    <div className="card p-3 h-100 justify-content-center">
                        <p className="fs-4">Air Temp</p>
                        <p className="fs-5">High: {maxAirTempCel?.air_temperature}°C / {maxAirTempFar}°F</p>
                        <p className="fs-5 mb-1">Low: {minAirTempCel?.air_temperature}°C / {minAirTempFar}°F</p>
                    </div>
                </div>

                <div className="col-md-3 col-12 text-center mb-2">
                    <div className="card p-3 h-100 justify-content-center">
                        <p className="fs-4">Track Temp</p>
                        <p className="fs-5">High: {maxTrackTempCel?.track_temperature}°C / {maxTrackTempFar}°F</p>
                        <p className="fs-5 mb-1">Low: {minTrackTempCel?.track_temperature}°C / {minTrackTempFar}°F</p>
                    </div>
                </div>

                <div className="col-md-3 col-12 text-center mb-2">
                    <div className="card p-3 h-100 justify-content-center">
                        <p className="fs-4">Wind</p>
                        <p className="fs-5">Direction: {windDirection}</p>
                        <p className="fs-5 mb-1">Speed: {maxWindSpeed?.wind_speed} KPH / {maxWindSpeedMPH} MPH</p>
                    </div>
                </div>

                <div className="col-md-3 col-12 text-center mb-2">
                    <div className="card p-3 h-100 justify-content-center" mb-2>
                        <p className="fs-4">Precipitation</p>
                        <p className="fs-5">Humidity: {humidity}%</p>
                        <p className="fs-5 mb-1">Rain During Session?: {rain}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Weather;