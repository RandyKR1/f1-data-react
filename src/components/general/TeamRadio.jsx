import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getTeamRadio, getDrivers } from "../../api";
import { mapDriverNames, groupByDriverName } from "../../utilities";

const TeamRadio = ({ sessionKey }) => {
    const [teamRadio, setTeamRadio] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [radioData, driverData] = await Promise.all([
                    getTeamRadio(sessionKey),
                    getDrivers(sessionKey),
                ]);
                setTeamRadio(radioData);
                setDrivers(driverData);
            } catch {
                setError("Could not load team radio.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [sessionKey]);

    if (loading) return <p>Loading team radio...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!teamRadio.length) return <p>No team radio available for this session.</p>;

    const radioByDriver = groupByDriverName(mapDriverNames(teamRadio, drivers));

    return (
        <Accordion>
            {Object.entries(radioByDriver).map(([driverName, radios]) => (
                <Accordion.Item eventKey={driverName} key={driverName}>
                    <Accordion.Header>
                        <span className="text-uppercase">{driverName}</span>
                    </Accordion.Header>
                    <Accordion.Body>
                        <ul className="list-unstyled d-flex flex-column align-items-center gap-2 mb-0">
                            {radios.map((radio, index) => (
                                <li key={index} className="w-100">
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
