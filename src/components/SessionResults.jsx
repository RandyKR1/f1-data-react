import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSessions } from "../api";
import TeamRadio from "./TeamRadio";
import Weather from "./Weather";
import Stints from "./Stints";
import RaceControl from "./RaceControl";
import Position from "./Postition";
import Laps from "./Laps";
import Intervals from "./Intervals";
import Pit from "./Pit";
import CarData from "./CarData";

const SessionResults = () => {
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
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full min-h-[40vh]">
          <p className="text-lg font-medium">
            Track: {sessionData.circuit_short_name} | Session: {sessionData.session_name} | Date: {new Date(sessionData.date_start).toLocaleDateString()}
          </p>
          <hr />
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
            <Laps sessionKey={sessionKey} />
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

export default SessionResults;