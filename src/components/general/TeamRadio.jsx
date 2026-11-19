import { useState, useEffect, useMemo } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getTeamRadio } from "../../api";
import { buildDriverMap, getDriverName, groupBy } from "../../utilities";

// `drivers` comes from the parent page, which has already fetched it for this session
const TeamRadio = ({ sessionKey, drivers = [] }) => {
    const [teamRadio, setTeamRadio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;
        let ignore = false;
        setLoading(true);
        setError(null);
        getTeamRadio(sessionKey)
            .then((data) => { if (!ignore) setTeamRadio(data); })
            .catch(() => { if (!ignore) setError("Could not load team radio."); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey]);

    const driverMap = useMemo(() => buildDriverMap(drivers), [drivers]);
    const radioByDriver = useMemo(() => groupBy(teamRadio, "driver_number"), [teamRadio]);

    if (loading) return <p>Loading team radio...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!teamRadio.length) return <p>No team radio available for this session.</p>;

    return (
        <Accordion>
            {Object.entries(radioByDriver).map(([driverNumber, radios]) => (
                <Accordion.Item eventKey={driverNumber} key={driverNumber}>
                    <Accordion.Header>
                        <span className="text-uppercase">{getDriverName(driverMap, driverNumber)}</span>
                    </Accordion.Header>
                    <Accordion.Body>
                        <ul className="list-unstyled d-flex flex-column align-items-center gap-2 mb-0">
                            {radios.map((radio) => (
                                <li key={radio.recording_url} className="w-100">
                                    {/* preload="none": don't download every MP3 until played */}
                                    <audio controls preload="none" src={radio.recording_url} className="w-100" />
                                </li>
                            ))}
                        </ul>
                    </Accordion.Body>
                </Accordion.Item>
            ))}
        </Accordion>
    );
};

export default TeamRadio;
