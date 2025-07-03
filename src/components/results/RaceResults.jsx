import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import {
    getLaps,
    getStints,
    getDrivers,
    getSessions,
    getMeetings,
    getPosition,
} from "../../api";
import Weather from "../general/Weather";
import Search from "../utility/Search";
import RaceControl from "../general/RaceControl";
import LapTimeChart from "../utility/LapTimeChart"
import TimedAlert from "../utility/TimedAlert";
import LongestStintByCompound from "../utility/LongestStintByCompound"
import FinalRaceClassification from "../utility/FinalRaceClassification";
import TeamRadio from "../general/TeamRadio"


const RaceResults = () => {
    const { sessionKey } = useParams();
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

    // console.log("Session Info", sessionInfo)
    // console.log("Meeting Info", meetingInfo)

    if (loading || !laps.length || !stints.length || !drivers.length) {
        return <div className="text-center mt-5">Loading Race Results...</div>;
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    return (
        <div className=" container vw-100">
            <TimedAlert
                message={"Lap Times May Be Inaccurate, Order Is Based On Final Position Data Provided By The API. This Also Impacts The Ability To Alter Final Positions After Penalties"}
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

            <div
                className="row">
                <Search />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <FinalRaceClassification
                        laps={laps}
                        drivers={drivers}
                        sessionKey={sessionKey}
                        sessionName={sessionInfo.session_name}
                        positionInfo={positionInfo}
                    />
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

                <div
                    className="row"
                    style={{ marginBottom: "20px" }}>
                    <p className="fs-3 text-center">Longest Stint By Compound</p>
                    <LongestStintByCompound stints={stints} drivers={drivers} />
                </div>

                <motion.div
                    className="row"
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="col-md-6 text-center">
                        <p className="fs-3">Team Radio Messages</p>
                        <div
                            style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <TeamRadio sessionKey={sessionKey} />
                        </div>
                    </div>
                    <div className="col-md-6 text-center ">
                        <p className="fs-3">Race Control Messages</p>
                        <div
                            style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
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

export default RaceResults