import React, {useState, useEffect} from "react";
import { getRaceControl } from "../api";

const RaceControl = ({sessionKey}) => {
    const [raceControl, setRaceControl] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchRaceControl = async () => {
            const data = await getRaceControl(sessionKey);
            console.log("Race Control Data:", data)
            setRaceControl(data);
            setLoading(false);
        }
        fetchRaceControl();

    }, [sessionKey]);


    if (loading || !raceControl.length) {
        return <p>Loading Race Control Data...</p>;
    }

    return(
        <div>
        </div>
    )
}

export default RaceControl;