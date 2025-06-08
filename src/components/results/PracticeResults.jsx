import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLaps, getStints, getDrivers, getSessions, getMeetings } from "../../api";
import Weather from "../general/Weather";
import FastestLapsTable from "../utility/FastestLapsTable";
import Search from "../utility/Search";
import RaceControl from "../general/RaceControl";

const PracticeResults = () => {
    const { sessionKey } = useParams(); // FP1, FP2, FP3 session key
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


    // console.log("Session Info", sessionInfo)
    // console.log("Meeting Info", meetingInfo)


    if (loading || !laps.length || !stints.length || !drivers.length) {
        return <div>Loading practice results...</div>;
    }

  const getDriverName = (driver_number) =>
    drivers.find((d) => d.driver_number === driver_number)?.last_name || "Unknown";

  const getLongestStintByCompound = () => {
    const result = {};
    for (let stint of stints) {
      const length = stint.lap_end - stint.lap_start + 1;
      const key = stint.compound;
      if (!result[key] || length > result[key].length) {
        result[key] = {
          length,
          driver: getDriverName(stint.driver_number),
          compound: stint.compound,
        };
      }
    }
    return Object.values(result);
  }; 

  return (
    <div className="
            container 
            vw-100
            text-light">
      {/* Meeting Title */}
      <div className="container-fluid my-4 p-0 d-flex">
        <h4 className="col-md-6 text-center">{meetingInfo.meeting_official_name}</h4>
        <h3 className="col-md-6 text-center">Free {sessionInfo.session_name} Results</h3>
    </div>

    <div className="col-md-12">
      <div>
        <Search />
      </div>
    </div>

    <div className="row">
      {/* Main Content - 75% */}
      <div className="col-md-12">
        <div className="mb-4 border border-secondary border-4 rounded-2" style={{ maxHeight: "50vh", overflowY: "auto", width: "100%" }}>
          <FastestLapsTable 
            laps={laps} 
            drivers={drivers}
            sessionKey={sessionKey}
            sessionName={sessionInfo.session_name} 
          />
        </div>

        {/* Bottom Left/Right - Weather and Stint Info */}
        <div className="row mt-5  d-flex justify-content-center">
          <div className="col-md-5 me-4 border border-secondary border-4 rounded-2">
            <h4>Weather</h4>
            <Weather sessionKey={sessionKey} />
          </div>
          <div className="col-md-5 ms-4 border border-secondary border-4 rounded-2">
            <h4>Longest Stint by Compound</h4>
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>Compound</th>
                  <th>Driver</th>
                  <th>Laps</th>
                </tr>
              </thead>
              <tbody>
                {getLongestStintByCompound().map((stint, index) => (
                  <tr key={index}>
                    <td>{stint.compound}</td>
                    <td>{stint.driver}</td>
                    <td>{stint.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>



    {/* Race Control at Bottom */}
    <div className="mt-4">
      <RaceControl sessionKey={sessionKey} />
    </div>
  </div>
);

};

export default PracticeResults;
