import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getRaceControl } from "../../api";

// OpenF1 has no id field for race control messages. Several can share a
// timestamp, so the key combines timestamp, category and text.
const messageKey = (rc) => `${rc.date}|${rc.category}|${rc.message}`;

// Drop exact repeats (same time, category and text) so every key is unique
const uniqueMessages = (messages) => [
    ...new Map(messages.map((rc) => [messageKey(rc), rc])).values(),
];

const RaceControl = ({ sessionKey }) => {
    const [raceControl, setRaceControl] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;
        let ignore = false;
        setLoading(true);
        setError(null);
        getRaceControl(sessionKey)
            .then((data) => { if (!ignore) setRaceControl(uniqueMessages(data)); })
            .catch(() => { if (!ignore) setError("Could not load race control messages."); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey]);

    if (loading) return <p>Loading race control messages...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!raceControl.length) return <p>No race control messages for this session.</p>;

    return (
        <Accordion>
            {raceControl.map((rc) => (
                <Accordion.Item eventKey={messageKey(rc)} key={messageKey(rc)}>
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
