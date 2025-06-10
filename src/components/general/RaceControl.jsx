import React, {useState, useEffect} from "react";
import { getRaceControl } from "../../api";

const RaceControl = ({sessionKey}) => {
    const [raceControl, setRaceControl] = useState([])
    const [loading, setLoading] = useState(true);
    const [expandedMessage, setExpandedMessage] = useState(null);

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

    const toggleMessage = (raceControl) => {
        setExpandedMessage((prev) => (prev === raceControl ? null : raceControl));
    };

    return(
        <div className="col-md-6">
            {raceControl.map((rc) => 
                <div key={rc.date}>
                    <button onClick={() => toggleMessage(rc)} className="fw-bold text-uppercase">
                        {rc.category === "Flag" ? rc.flag : rc.category}
                    </button>
                    {expandedMessage === rc && (
                        <ul className="flex flex-col justify-center items-center space-y-2">
                            {rc.message}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )}

export default RaceControl;