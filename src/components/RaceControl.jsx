import React, {useState, useEffect} from "react";
import { getRaceControl } from "../api";
import { filterDupes } from "../utilities";

const RaceControl = () => {
    const [raceControl, setRaceControl] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchRaceControl = async () => {
            const data = await getRaceControl(session_key);
            setRaceControl(data);
            setLoading(false);
        }
        fetchRaceControl();

    }, [session_key]);


    if(loading){
        return <p>Loading Race Control Data...</p>
    }

    const filteredRaceControl = filterDupes(raceControl, "session_key");

    return(
        <div>
        </div>
    )
}

export default RaceControl;