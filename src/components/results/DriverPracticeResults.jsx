import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getLaps,
    getStints,
    getDrivers,
    getSessions,
    getMeetings,
    getPosition,
} from "../../api";
import { getDriverFinalPosition, getMinBy } from "../../utilities";

const DriverPracticeResults = () => {
    const { sessionKey, driver_number } = useParams();
    const [drivers, setDrivers] = useState([]);
    const [laps, setLaps] = useState([]);
    const [stints, setStints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null);
    const [positionInfo, setPositionInfo] = useState(null);

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

    if (loading) {
        return <div>Loading Results...</div>;
    }

    const driver = drivers.find(
        (d) => d.driver_number.toString() === driver_number
    );
    if (!driver) {
        return <div>Driver not found</div>;
    }

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

    const fullName = `${driver.first_name} ${driver.last_name}`;
    const headShot = driver.headshot_url;
    const driverNumber = driver.driver_number;
    const finalPosition = getDriverFinalPosition(driverNumber, positionInfo);

    return (
        <div className="container vw-100">
            <div className="row align-items-center mb-4">
                <div className="col-md-4 d-flex flex-column align-items-center">
                    <img
                        src={headShot}
                        alt={`${fullName} Headshot`}
                        style={{ maxWidth: "100px", borderRadius: "12px" }}
                    />
                    <p className="fw-bold mt-2">
                        {fullName} #{driverNumber}
                    </p>
                    <p className="fw-bold">{driver.team_name}</p>
                </div>

                <div className="col-md-8 text-center fw-bold">
                    <h3>{meetingInfo.meeting_official_name}</h3>
                    <h4>Free {sessionInfo.session_name} Driver Results</h4>
                </div>
            </div>

            <div className="row text-center mb-4">
                <div className="col-md-4">
                    <p className="fw-bold">Finishing Position</p>
                    <p>P{finalPosition}</p>
                </div>
                <div className="col-md-4">
                    <p className="fw-bold">Fastest Lap</p>
                    <p>{bestLap ? bestLap.lap_duration : "N/A"}</p>
                </div>
                <div className="col-md-4">
                    <p className="fw-bold">Race Duration</p>
                    <p>{/* Add race duration here if available */}</p>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <p className="fw-bold">Team Radio</p>
                    <p>{/* Add team radio info here if available */}</p>
                </div>
                <div className="col-md-6">
                    <p className="fw-bold">Compound</p>
                    <p>{driverStints.length > 0 ? driverStints[0].compound : "N/A"}</p>
                </div>
            </div>
        </div>
    );
};

export default DriverPracticeResults;
