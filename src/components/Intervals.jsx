import React, {useState, useEffect} from "react";
import { getIntervals } from "../api";

const Intervals = () => {
    const [intervals, setIntervals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        const fetchIntervalData = async () => {
            if (!sessionKey) return;

            const data = await getIntervals(sessionKey);
            setIntervals(data);
            setLoading(false);
        }

        fetchIntervalData();
    }, [sessionKey]);

    if(loading){
        return <p>Loading Intervals...</p>
    }

    const filteredIntervals = filterDupes(intervals, "session_key");

    return(
        <></>
    )
}

export default Intervals;