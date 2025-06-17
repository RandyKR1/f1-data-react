import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Search from "../utility/Search";
import FastestLapsTable from "../utility/FastestLapsTable";
import LapTimeChart from "../utility/LapTimeChart";
import Weather from "../general/Weather";
import RaceControl from "../general/RaceControl";
import {
    getLaps,
    getStints,
    getDrivers,
    getSessions,
    getMeetings
} from "../../api";
import TeamRadio from "../general/TeamRadio";


const QualifyingResults = () => {
    const { sessionKey } = useParams();
    const [drivers, setDrivers] = useState([]);
    const [laps, setLaps] = useState([])
    const [stints, setStints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [lapData, stintData, driverData, sessionData, meetingData] = await Promise.all([
                getLaps(sessionKey),
                getStints(sessionKey),
                getDrivers(sessionKey),
                getSessions(),
                getMeetings()
            ]);
            const foundSession = sessionData.find((s) => s.session_key.toString() === sessionKey);
            const foundMeeting = meetingData.find((m) => m.meeting_key === foundSession.meeting_key);

            setStints(stintData);
            setDrivers(driverData);
            setLaps(lapData);
            setSessionInfo(foundSession);
            setMeetingInfo(foundMeeting);
            setLoading(false);
        };

        fetchData();
    }, [sessionKey]);

    if (loading || !laps.length || !stints.length || !drivers.length) {
        return <div>Loading Qualifying Results...</div>;
    }

    console.log("Meeting:", meetingInfo)

    return (
        <div className=" container vw-100">
            <div className="row mt-5 mb-4 p-0 d-flex">
                <h3 className="col-sm-12 col-md-6 text-center text">{meetingInfo.meeting_official_name}</h3>
                <h3 className="col-md-6 text-center">Qualifying Results</h3>
            </div>

            <div className="row">
                <Search />
                <div>
                    <FastestLapsTable
                        laps={laps}
                        drivers={drivers}
                        sessionKey={sessionKey}
                        sessionName={sessionInfo.session_name}
                    />
                </div>
            </div>

            <div className="row">
                <div className="col-md-12">
                    <LapTimeChart sessionKey={sessionKey} drivers={drivers} laps={laps} />
                </div>
            </div>

            <div className="row my-5 d-flex justify-content-center">
                <Weather sessionKey={sessionKey} />
                <div className="row">
                    <div className="col-md-6 text-center">
                        <p className="fw-bold fs-3">Team Radio Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <TeamRadio sessionKey={sessionKey} />
                        </div>
                    </div>
                    <div className="col-md-6 text-center ">
                        <p className="fw-bold fs-3">Race Control Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <RaceControl sessionKey={sessionKey} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}

export default QualifyingResults