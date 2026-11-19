import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getTeamRadio } from "../../api";

// `drivers` comes from the parent page, which has already fetched it for this session
const DriverTeamRadio = ({ sessionKey, driverNumber, drivers = [] }) => {
    const [teamRadio, setTeamRadio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey || !driverNumber) return;
        let ignore = false;
        setLoading(true);
        setError(null);
        getTeamRadio(sessionKey)
            .then((data) => {
                if (ignore) return;
                setTeamRadio(data.filter((radio) => radio.driver_number === Number(driverNumber)));
            })
            .catch(() => { if (!ignore) setError("Could not load team radio."); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey, driverNumber]);

    if (loading) return <p>Loading team radio...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!teamRadio.length) return <p>No team radio available for this driver.</p>;

    const driver = drivers.find((d) => d.driver_number === Number(driverNumber));
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : `#${driverNumber}`;

    return (
        <Accordion className="mt-4">
            <Accordion.Item eventKey="driver-radio">
                <Accordion.Header>
                    <span className="text-uppercase">Team Radio: {driverName}</span>
                </Accordion.Header>
                <Accordion.Body className="d-flex flex-column align-items-center gap-3">
                    {teamRadio.map((radio) => (
                        <audio
                            key={radio.recording_url}
                            controls
                            preload="none"
                            src={radio.recording_url}
                            className="w-100"
                        />
                    ))}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
};

export default DriverTeamRadio;
