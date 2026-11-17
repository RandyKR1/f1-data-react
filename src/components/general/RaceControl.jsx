import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getRaceControl } from "../../api";

const RaceControl = ({ sessionKey }) => {
    const [raceControl, setRaceControl] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchRaceControl = async () => {
            setLoading(true);
            setError(null);
            try {
                setRaceControl(await getRaceControl(sessionKey));
            } catch {
                setError("Could not load race control messages.");
            } finally {
                setLoading(false);
            }
        };
        fetchRaceControl();
    }, [sessionKey]);

    if (loading) return <p>Loading race control messages...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!raceControl.length) return <p>No race control messages for this session.</p>;

    return (
        <Accordion>
            {raceControl.map((rc, index) => (
                <Accordion.Item eventKey={String(index)} key={index}>
                    <Accordion.Header>
                        <span className="text-uppercase">
                            {rc.category === "Flag" ? rc.flag : rc.category}
                        </span>
                    </Accordion.Header>
                    <Accordion.Body>{rc.message}</Accordion.Body>
                </Accordion.Item>
            ))}
        </Accordion>
    );
};

export default RaceControl;
