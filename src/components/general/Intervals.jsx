import React, {useState, useEffect} from "react";
import { getIntervals } from "../../api";

const Intervals = ({sessionKey}) => {
    const [intervals, setIntervals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIntervalData = async () => {
            if (!sessionKey) return;

            const data = await getIntervals(sessionKey);
            console.log("Interval Data:", data);
            setIntervals(data);
            setLoading(false);
        }

        fetchIntervalData();
    }, [sessionKey]);

    if(loading || !intervals.length){
        return <p>Loading Intervals...</p>
    }

    return(
        <></>
    )
}

export default Intervals;