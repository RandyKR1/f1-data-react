import React, {useState, useEffect} from "react";
import { getPit } from "../api";
import { filterDupes } from "../utilities";

const Pit = () => {
    const [pit, setPit] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchPit = async () => {
            const data = await getPit(session_key);
            setPit(data);
            setLoading(false);
        }
        fetchPit();

    }, [session_key]);


    if(loading){
        return <p>Loading Pit Data...</p>
    }

    const filteredPitData = filterDupes(pit, "session_key");

    return(
        <div>
        </div>
    )
}

export default Pit;