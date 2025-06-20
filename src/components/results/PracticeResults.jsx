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
import Weather from "../general/Weather";
import FinalClassificationTable from "../utility/FinalClassificationTable";
import Search from "../utility/Search";
import RaceControl from "../general/RaceControl";
import LapTimeChart from "../utility/LapTimeChart"
import TimedAlert from "../utility/TimedAlert";
import LongestStintByCompound from "../utility/LongestStintByCompound"

const PracticeResults = () => {
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
    return <div>Loading practice results...</div>;
  }


  return (
    <div className=" container vw-100">
      <TimedAlert
        message={"Lap Times May Be Inaccurate, Order Is Based On Final Position Data Provided By The API"}
      />
      <div className="row mt-5 mb-4 p-0 d-flex">
        <h3 className="col-sm-12 col-md-6 text-center text">{meetingInfo.meeting_official_name}</h3>
        <h3 className="col-md-6 text-center">Free {sessionInfo.session_name} Results</h3>
      </div>

      <div className="row">
        <Search />
        <div>
          <FinalClassificationTable
            laps={laps}
            drivers={drivers}
            sessionKey={sessionKey}
            sessionName={sessionInfo.session_name}
            positionInfo={positionInfo}
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
            <LongestStintByCompound stints={stints} drivers={drivers} />
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
};

export default PracticeResults;
