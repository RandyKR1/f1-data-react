import { useState, useEffect } from "react";
import { getWeather } from "../../api";
import { getMaxBy, getMinBy, getAverageBy, toFahrenheit, msToKph, msToMph, getWindDirection, rainfall } from "../../utilities";

const Weather = ({ sessionKey }) => {
    const [weather, setWeather] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;
        let ignore = false;
        setLoading(true);
        setError(null);
        getWeather(sessionKey)
            .then((data) => { if (!ignore) setWeather(data); })
            .catch(() => { if (!ignore) setError("Could not load weather data."); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey]);

    if (loading) return <p className="text-center">Loading weather data...</p>;
    if (error) return <p className="text-center text-danger">{error}</p>;
    if (!weather.length) return <p className="text-center">No weather data for this session.</p>;

    const minAirTempCel = getMinBy(weather, "air_temperature")
    const maxAirTempCel = getMaxBy(weather, "air_temperature")
    const maxAirTempFar = toFahrenheit(maxAirTempCel.air_temperature)
    const minAirTempFar = toFahrenheit(minAirTempCel.air_temperature)

    const minTrackTempCel = getMinBy(weather, "track_temperature");
    const maxTrackTempCel = getMaxBy(weather, "track_temperature");
    const minTrackTempFar = toFahrenheit(minTrackTempCel.track_temperature)
    const maxTrackTempFar = toFahrenheit(maxTrackTempCel.track_temperature)

    // Strongest one-minute wind sample of the session (OpenF1 reports m/s)
    const maxWind = getMaxBy(weather, "wind_speed")
    const maxWindKph = msToKph(maxWind.wind_speed);
    const maxWindMph = msToMph(maxWind.wind_speed);
    const windDirection = getWindDirection(maxWind.wind_direction)

    const humidity = getAverageBy(weather, "humidity");

    const rain = rainfall(weather, "rainfall")

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
                        <p className="fs-4">Max Wind</p>
                        <p className="fs-5">Direction: {windDirection}</p>
                        <p className="fs-5 mb-1">Speed: {maxWindKph} km/h / {maxWindMph} mph</p>
                    </div>
                </div>

                <div className="col-md-3 col-12 text-center mb-2">
                    <div className="card p-3 h-100 justify-content-center">
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