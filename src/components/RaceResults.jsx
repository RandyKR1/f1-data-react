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

const RaceResults = () => {
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
  <div>
    <h2>Race Results</h2>
    {sessionData ? (
      <>
        <p>Track: {sessionData.circuit_short_name}</p>
        <p>Session Name: {sessionData.session_name}</p>
        <p>Date: {new Date(sessionData.date_start).toLocaleDateString()}</p>
        <div><Weather sessionKey={sessionKey} /></div>
        {/* <div><Position sessionKey={sessionKey} /></div>
        <div><Laps sessionKey={sessionKey} /></div>
        <div><Intervals sessionKey={sessionKey} /></div>
        <div><TeamRadio sessionKey={sessionKey} /></div> 
        <div><RaceControl sessionKey={sessionKey} /></div>
        <div><Stints sessionKey={sessionKey} /></div>
        <div><Pit sessionKey={sessionKey}/></div>
        <div><CarData sessionKey={sessionKey} /></div> */}
                {/* Think about displaying these in drivers page only */}

      </>
    ) : (
      <p>Loading session data...</p>
    )}
  </div>
);

};

export default RaceResults;