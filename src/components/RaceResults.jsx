import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSessions } from "../api";

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
        {/* Other session info */}
      </>
    ) : (
      <p>Loading session data...</p>
    )}
  </div>
);

};

export default RaceResults;