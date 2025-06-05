import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLaps, getStints, getDrivers, getSessions, getMeetings } from "../../api";
import Weather from "../general/Weather";
import FastestLapsTable from "../utility/FastestLapsTable";
import Search from "../utility/Search";

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


    console.log("Session Info", sessionInfo)
    console.log("Meeting Info", meetingInfo)


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
    <div>
    <Search />
    <h2>{meetingInfo.meeting_official_name}</h2>
     <h3> Free {sessionInfo.session_name} Results</h3>
     <FastestLapsTable laps={laps} drivers={drivers} />
     <Weather sessionKey={sessionKey}/>

    <div>
        <h3>Longest Stint by Compound</h3>
        <table>
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
  );
};

export default PracticeResults;
