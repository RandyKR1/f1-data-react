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
        return <p>Loading Race Control Data... Try Refreshing</p>;
    }

    return(
    <div className="accordion" id="raceControlAccordion">
        {raceControl.map((rc, index) => (
        <div className="accordion-item" key={index}>
            <h2 className="accordion-header" id={`heading-${index}`}>
            <button
                className="accordion-button collapsed text-uppercase"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse-${index}`}
                aria-expanded="false"
                aria-controls={`collapse-${index}`}
            >
                {rc.category === "Flag" ? rc.flag : rc.category}
            </button>
            </h2>
        <div
            id={`collapse-${index}`}
            className="accordion-collapse collapse"
            aria-labelledby={`heading-${index}`}
            data-bs-parent="#raceControlAccordion"
            >
            <div className="accordion-body">
                {rc.message}
            </div>
        </div>
    </div>
    ))}
</div>
)}

export default RaceControl;