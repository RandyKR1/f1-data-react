import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Search from "../utility/Search";
import FinalClassificationTable from "../utility/FinalClassificationTable";
import LapTimeChart from "../utility/LapTimeChart";
import Weather from "../general/Weather";
import RaceControl from "../general/RaceControl";
import { motion } from "motion/react";
import {
    getLaps,
    getStints,
    getDrivers,
    getSessions,
    getMeetings,
    getPosition,
} from "../../api";
import TeamRadio from "../general/TeamRadio";
import TimedAlert from "../utility/TimedAlert";


const QualifyingResults = () => {
    const { sessionKey } = useParams();
    const [drivers, setDrivers] = useState([]);
    const [laps, setLaps] = useState([])
    const [stints, setStints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [meetingInfo, setMeetingInfo] = useState(null)
    const [positionInfo, setPositionInfo] = useState(null)


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

    if (loading || !laps.length || !stints.length || !drivers.length) {
        return <div className="text-center mt-5">Loading Qualifying Results...</div>;
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className=" container vw-100">
            <TimedAlert
                message={"Lap Times May Be Inaccurate, Order Is Based On Final Position Data Provided By The API"}
            />
            <motion.div
                className="row mt-5 mb-4 p-0 d-flex flex-column text-start"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 2 }}>

                <h3 className="display-5 d-none d-md-block">{meetingInfo.meeting_official_name}</h3>
                <h3 className="display-6 d-none d-md-block">{sessionInfo.session_name} Results</h3>

                {/* Mobile Styling */}
                <h4 className="d-block d-md-none text-center">{meetingInfo.meeting_official_name}</h4>
                <h5 className="d-block d-md-none text-center">{sessionInfo.session_name} Results</h5>

            </motion.div>

            <div className="row">
                <Search />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="table-responsive">
                        <FinalClassificationTable
                            laps={laps}
                            drivers={drivers}
                            sessionKey={sessionKey}
                            sessionName={sessionInfo.session_name}
                            positionInfo={positionInfo}
                        />
                    </div>
                </motion.div>
            </div>

            <div className="row">
                <motion.div
                    className="col-md-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <LapTimeChart sessionKey={sessionKey} drivers={drivers} laps={laps} />
                </motion.div>
            </div>

            <div className="row mt-5 mb-2 d-flex justify-content-center">
                <motion.div
                    className="col-md-12"
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <Weather sessionKey={sessionKey} />
                </motion.div>

                <motion.div
                    className="row"
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="col-md-6 text-center mb-4">
                        <p className="fs-3">Team Radio Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <TeamRadio sessionKey={sessionKey} />
                        </div>
                    </div>
                    <div className="col-md-6 text-center mb-4">
                        <p className="fs-3">Race Control Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <RaceControl sessionKey={sessionKey} />

                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="row mb-3">
                <button
                    onClick={scrollToTop}
                    className="btn btn-dark "
                    aria-label="Back to top"
                >
                    Back to Top ↑
                </button>
            </div>

        </div>
    )

}

export default QualifyingResults