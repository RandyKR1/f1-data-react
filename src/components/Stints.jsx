import React, {useState, useEffect} from "react";
import { getStints } from "../api";
import { filterDupes } from "../utilities";

const Stints = () => {
    const [stints, setStints] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchStints = async () => {
            const data = await getStints(session_key);
            setStints(data);
            setLoading(false);
        } 
        fetchRaceControl();

    }, [session_key]);


    if(loading){
        return <p>Loading Stints Data...</p>
    }

    const filteredStints = filterDupes(stints, "session_key");

    return(
        <div>
        </div>
    )
}

export default Stints;