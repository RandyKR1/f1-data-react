import React, {useState, useEffect} from "react";
import { getSessions } from "../api";
import { filterDupes } from "../utilities";

const Session = () => {
    const [session, setSession] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSession = async () => {
            const data = await getSessions();
            setSession(data);
            // console.log(data)
            setLoading(false);
        }

        fetchSession();
    }, [])

    const filteredSession = filterDupes(session, "session_key")

    if (loading || !session.length) {
        return <p>Loading Session Data...</p>;
    }

    return(
        <div>
            <h1>Sessions</h1>

            <ul>
                {filteredSession.map((session)=> 
                    <li key={session.session_key}>
                        {session.session_name || `Session number ${session.session_key}`}
                    </li>
                )}
            </ul>
        </div>
    )
}

export default Session;