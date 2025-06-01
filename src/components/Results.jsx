import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSessions } from "../api";
import TeamRadio from "./general-components/TeamRadio";
import Weather from "./general-components/Weather";
import Stints from "./general-components/Stints";
import Intervals from "./general-components/Intervals";
import Pit from "./general-components/Pit";
import FastestLap from "./FastestLap";
import DriverSelector from "./DriverSelector";

const Results = () => {
  const { sessionKey } = useParams();
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
        const sessions = await getSessions();
        const session = sessions.find(
          (s) =>s.session_key.toString() === sessionKey
        );
        setSessionData(session);
        console.log("Full Session Data:", session);
    }

    if (sessionKey){
        fetchSessionData();
    }
  }, [sessionKey]);

return (
  <div className="min-h-[91vh] p-4 bg-gray-100 overflow-hidden">
    <h2 className="text-2xl font-bold mb-4">Session Results</h2>

    {sessionData ? (
      <>
        {/* ✅ Full-width top box */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full h-[40vh] overflow-y-auto">
          <p className="text-lg font-medium">
            Track: {sessionData.circuit_short_name} | Session: {sessionData.session_name} | Date: {new Date(sessionData.date_start).toLocaleDateString()}
          </p>
          <hr />
          <DriverSelector sessionKey={sessionKey} />
        </div>

        {/* ✅ 3-column grid for smaller boxes below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Weather sessionKey={sessionKey} />
          </div>
          <div className="h-[40vh] overflow-y-auto bg-white p-4 rounded-lg shadow-sm">
            <TeamRadio sessionKey={sessionKey} />
          </div>
          <div className="h-[40vh] overflow-y-auto bg-white p-4 rounded-lg shadow-sm">
            <Stints sessionKey={sessionKey} />
            <FastestLap sessionKey={sessionKey} />
            <Pit sessionKey={sessionKey} />
            <Intervals sessionKey={sessionKey} />
          </div>
        </div>
      </>
    ) : (
      <p>Loading session data...</p>
    )}
  </div>
);


};

export default Results;