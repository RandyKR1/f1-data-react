import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { loadSessionData, getErrorMessage } from "../../api";
import {
    SESSION_ROUTES,
    getMinBy,
    lapToMinFormat,
    formatPosition,
    getOfficialBestLap,
} from "../../utilities";
import DriverTeamRadio from "../general/DriverTeamRadio";
import LapTimeChart from "../utility/LapTimeChart";
import ErrorMessage from "../utility/ErrorMessage";

const DriverPracticeResults = () => {
    const { sessionKey, driver_number } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Ignore responses from an older sessionKey that arrive after we've moved on
        let ignore = false;
        setLoading(true);
        setError(null);
        loadSessionData(sessionKey)
            .then((result) => { if (!ignore) setData(result); })
            .catch((err) => { if (!ignore) setError(getErrorMessage(err)); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey]);

    if (loading || (!data && !error)) return <div className="text-center mt-5">Loading Results...</div>;
    if (error) return <ErrorMessage message={error} />;

    const { session, meeting, drivers, laps, results } = data;
    const driverNumber = Number(driver_number);
    const driver = drivers.find((d) => d.driver_number === driverNumber);
    if (!driver) return <ErrorMessage message="Driver not found in this session." />;

    const result = results.find((r) => r.driver_number === driverNumber);
    const fastestTimedLap = getMinBy(
        laps.filter((lap) => lap.driver_number === driverNumber && lap.lap_duration != null),
        "lap_duration"
    );
    const bestLap = getOfficialBestLap(result, session.session_type) ?? fastestTimedLap?.lap_duration;
    const fullName = `${driver.first_name} ${driver.last_name}`;

    return (
        <div className="container py-4">
            <Link to={`/${SESSION_ROUTES.Practice}/${sessionKey}`} className="btn btn-outline-secondary mb-3">
                ← Back to Results
            </Link>

            <div className="row align-items-center my-5">
                <div className="col-md-3 text-center">
                    <img
                        src={driver.headshot_url}
                        alt={`${fullName} Headshot`}
                        className="img-fluid rounded mb-2"
                        style={{ maxWidth: "120px" }}
                    />
                    <h5 className="fw-bold mb-0">{fullName}</h5>
                    <p className="text-muted mb-0">#{driverNumber}</p>
                    <p className="fw-semibold text-uppercase">{driver.team_name}</p>
                </div>

                <div className="col-md-9 text-center">
                    <h3 className="fw-bold">{meeting?.meeting_official_name ?? "Grand Prix"}</h3>
                    <h4 className="text-secondary">
                        Free {session.session_name} Driver Results
                    </h4>
                </div>
            </div>

            {/* Key Stats */}
            <div className="row text-center mb-5">
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <p className="card-title fw-bold mb-1">Finishing Position</p>
                            <h5 className="mb-0">{formatPosition(result)}</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <p className="card-title fw-bold mb-1">Fastest Lap</p>
                            <h5 className="mb-0">{bestLap != null ? lapToMinFormat(bestLap) : laps.length ? "N/A" : "–"}</h5>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Radio + Lap Chart */}
            <div className="row">
                <div className="col-md-12 mb-4">
                    <h5 className="fw-bold mb-3">Team Radio</h5>
                    <DriverTeamRadio
                        sessionKey={sessionKey}
                        driverNumber={driverNumber}
                        drivers={drivers}
                    />
                </div>
                <div className="col-md-12 mb-4">
                    <LapTimeChart drivers={drivers} laps={laps} initialDrivers={[driverNumber]} />
                </div>
            </div>
        </div>
    );
};

export default DriverPracticeResults;
