import { useState, useEffect } from "react";
import Accordion from "react-bootstrap/Accordion";
import { getTeamRadio, getDrivers } from "../../api";

const DriverTeamRadio = ({ sessionKey, driverNumber }) => {
    const [teamRadio, setTeamRadio] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionKey || !driverNumber) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [radioData, driverData] = await Promise.all([
                    getTeamRadio(sessionKey),
                    getDrivers(sessionKey),
                ]);
                setDrivers(driverData);
                setTeamRadio(
                    radioData.filter(
                        (radio) => radio.driver_number.toString() === driverNumber.toString()
                    )
                );
            } catch {
                setError("Could not load team radio.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [sessionKey, driverNumber]);

    if (loading) return <p>Loading team radio...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!teamRadio.length) return <p>No team radio available for this driver.</p>;

    const driver = drivers.find((d) => d.driver_number.toString() === driverNumber.toString());
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : `#${driverNumber}`;

    return (
        <Accordion className="mt-4">
            <Accordion.Item eventKey="driver-radio">
                <Accordion.Header>
                    <span className="text-uppercase">Team Radio: {driverName}</span>
                </Accordion.Header>
                <Accordion.Body className="d-flex flex-column align-items-center gap-3">
                    {teamRadio.map((radio, index) => (
                        <audio
                            key={index}
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
