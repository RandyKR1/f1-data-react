import React, {useState, useEffect} from "react";
import { getRaceControl } from "../../api";

const RaceControl = ({sessionKey}) => {
    const [raceControl, setRaceControl] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchRaceControl = async () => {
            const data = await getRaceControl(sessionKey);
            setRaceControl(data);
            setLoading(false);
        }
        fetchRaceControl();

    }, [sessionKey]);


    if (loading || !raceControl.length) {
        return <p>Loading Race Control Data...</p>;
    }

    console.log("Race Control Data:", raceControl)

    return(
        <div className="col-md-6">
            {raceControl.map((rc) => 
                <li key={rc.date}>
                    <p>{rc.flag}</p> 
                    <p>{rc.category}</p>
                    <p>{rc.message}</p>
                </li>
            )}
        </div>
    )
}

export default RaceControl;