import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    getLaps,
    getStints,
    getDrivers,
    getSessions,
    getMeetings,
    getPosition,
} from "../../api";
import { getDriverFinalPosition, getMinBy, lapToMinFormat } from "../../utilities";
import LongestStintByCompound from "../utility/LongestStintByCompound";
import DriverTeamRadio from "../general/DriverTeamRadio";
import LapTimeChart from "../utility/LapTimeChart";

const DriverRaceResults = () => {
    const { sessionKey, driver_number } = useParams();
    const [drivers, setDrivers] = useState([]);
    const [laps, setLaps] = useState([]);
    const [stints, setStints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null);
    const [positionInfo, setPositionInfo] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [
                lapData,
                stintData,
                driverData,
                positionData,
                sessionData,
                meetingData,
            ] = await Promise.all([
                getLaps(sessionKey),
                getStints(sessionKey),
                getDrivers(sessionKey),
                getPosition(sessionKey),
                getSessions(),
                getMeetings(),
            ]);

            const foundSession = sessionData.find(
                (s) => s.session_key.toString() === sessionKey
            );
            const foundMeeting = meetingData.find(
                (m) => m.meeting_key === foundSession.meeting_key
            );

            setLaps(lapData);
            setStints(stintData);
            setDrivers(driverData);
            setPositionInfo(positionData);
            setSessionInfo(foundSession);
            setMeetingInfo(foundMeeting);
            setLoading(false);
        };

        fetchData();
    }, [sessionKey]);

    if (loading) return <div className="text-center mt-5">Loading Results...</div>;

    const driver = drivers.find(
        (d) => d.driver_number.toString() === driver_number
    );
    if (!driver) return <div className="text-center mt-5">Driver not found. Please Refresh The Page</div>;

    const driverLaps = laps.filter(
        (lap) => lap.driver_number.toString() === driver_number
    );

    const driverStints = stints.filter(
        (stint) => stint.driver_number.toString() === driver_number
    );

    const bestLap = getMinBy(
        driverLaps.filter((lap) => lap.lap_duration != null),
        "lap_duration"
    );

    const formattedBestLap = bestLap ? lapToMinFormat(bestLap.lap_duration) : "N/A";

    const fullName = `${driver.first_name} ${driver.last_name}`;
    const headShot = driver.headshot_url;
    const driverNumber = driver.driver_number;
    const finalPosition = getDriverFinalPosition(driverNumber, positionInfo);

    return (
        <div className="container py-4">
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-outline-secondary"
                >
                    ← Back to Results
                </button>
            </div>

            <div className="row align-items-center mb-5">
                <div className="col-md-3 text-center">
                    <img
                        src={headShot}
                        alt={`${fullName} Headshot`}
                        className="img-fluid rounded mb-2"
                        style={{ maxWidth: "120px" }}
                    />
                    <h5 className="fw-bold mb-0">{fullName}</h5>
                    <p className="text-muted mb-0">#{driverNumber}</p>
                    <p className="fw-semibold text-uppercase">{driver.team_name}</p>
                </div>

                <div className="col-md-9 text-center">
                    <h3 className="fw-bold">{meetingInfo.meeting_official_name}</h3>
                    <h4 className="text-secondary">
                        {sessionInfo.session_name} Driver Results
                    </h4>
                </div>
            </div>

            <div className="row text-center mb-5">
                <div className="col-md-5 offset-md-1">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <p className="card-title fw-bold mb-1">Finishing Position</p>
                            <h5 className="mb-0">P{finalPosition}</h5>
                        </div>
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <p className="card-title fw-bold mb-1">Fastest Lap</p>
                            <h5 className="mb-0">{formattedBestLap}</h5>
                        </div>
                    </div>
                </div>
            </div>


            <div className="row">
                <div className="col-md-10 mb-5 text-center offset-md-1">
                    <h5 className="fw-bold mb-3">Team Radio</h5>
                    <DriverTeamRadio
                        sessionKey={sessionKey}
                        driverNumber={driver_number}
                    />
                </div>

                <div className="col-md-10 mb-4 text-center offset-md-1">
                    <h5 className="fw-bold mb-3">Stint Information</h5>
                    <LongestStintByCompound
                        stints={driverStints}
                        drivers={drivers}
                        driverNumber={driver.driver_number}
                    />
                </div>
            </div>

            <div className="col-md-12 mb-5">
                <LapTimeChart
                    sessionKey={sessionKey}
                    drivers={drivers} laps={laps} />
            </div>
        </div>
    );
};

export default DriverRaceResults;
