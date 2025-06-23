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
import { getDriverFinalPosition } from "../../utilities";

const DriverPracticeResults = () => {

    const { sessionKey, driver_number } = useParams();
    const [drivers, setDrivers] = useState([]);
    const [laps, setLaps] = useState([])
    const [stints, setStints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null)
    const [positionInfo, setPositionInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [lapData, stintData, driverData, positionData, sessionData, meetingData] = await Promise.all([
                getLaps(sessionKey),
                getStints(sessionKey),
                getDrivers(sessionKey),
                getPosition(sessionKey),
                getSessions(),
                getMeetings()
            ]);
            const foundSession = sessionData.find((s) => s.session_key.toString() === sessionKey);
            const foundMeeting = meetingData.find((m) => m.meeting_key === foundSession.meeting_key);

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

    const driver = drivers.find((d) => d.driver_number.toString() === driver_number);
    const driverLaps = laps.filter((lap) => lap.driver_number.toString() === driver_number);
    const driverStints = stints.filter((stint) => stint.driver_number.toString() === driver_number);
    const driverPosition = positionInfo.find((position) => position.driver_number.toString() === driver_number);

    const bestLap = driverLaps
        .filter((lap) => lap.lap_duration)
        .reduce(
            (best, current) =>
                !best || current.lap_duration < best.lap_duration
                    ? current
                    : best,
            null
        );

    const totalLaps = driverLaps.length;
    const fullName = `${driver.first_name} ${driver.last_name}`
    const headShot = driver.headshot_url
    const driverNumber = driver.driver_number
    const finalPosition = getDriverFinalPosition(driverNumber, positionInfo)

    console.log("Session Info", sessionInfo)
    console.log("Meeting Info", meetingInfo)
    console.log("Driver", driver)
    console.log("Lap Data", driverLaps)
    console.log("Stint Data", driverStints)
    console.log("Position Data", driverPosition)


    return (
        <div>
            <div className="container vw-100">


                <div className="row">
                    <div className="col-md-4 d-flex flex-column">
                        <img
                            src={headShot}
                            alt=""
                            style={{ maxWidth: "100px", borderRadius: "12px" }}
                        />
                        <p className="fw-bold">{fullName} #{driverNumber}</p>
                        <p className="fw-bold">{driver.team_name}</p>
                    </div>

                    <div className="col-md-8 fw-bold d-flex flex-column">
                        <h3 className="col-sm-12 col-md-6 text-center text">{meetingInfo.meeting_official_name}</h3>
                        <h3 className="col-md-6 text-center">Free {sessionInfo.session_name} Driver Results</h3>
                    </div>
                </div>


                <div className="row">
                    <div className="col-md-4 d-flex flex-column">
                        <p className="fw-bold">Final Position</p>
                        <p>P{finalPosition}</p>
                    </div>
                    <div className="col-md-4">Fastest Lap</div>
                    <div className="col-md-4">Race Duration</div>
                </div>
                <div class="row">
                    <div class="col-md-6">Team Radio</div>
                    <div class="col-md-6">Race Control</div>
                </div>
            </div>
        </div >
    )
}

export default DriverPracticeResults