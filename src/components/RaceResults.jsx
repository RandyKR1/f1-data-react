
/** Session Data not console logging. Fix that next */



import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSessions } from "../api";

const RaceResults = () => {
  const { sessionKey } = useParams();
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    const fetchSessionData = async () => {
        const sessions = await getSessions();
        const session = sessions.find((s) =>
            s.session_key.toSrting() === sessionKey
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
      <p>Showing results for session key: {sessionKey}</p>
    </div>
  );
};

export default RaceResults;