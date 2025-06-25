import React, { useState, useEffect } from "react";
import { getTeamRadio, getDrivers } from "../../api";
import { mapDriverNames } from "../../utilities";

const DriverTeamRadio = ({ sessionKey, driverNumber }) => {
    const [teamRadio, setTeamRadio] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!sessionKey || !driverNumber) return;

        const fetchData = async () => {
            const [radioData, driverData] = await Promise.all([
                getTeamRadio(sessionKey),
                getDrivers(sessionKey),
            ]);
            setDrivers(driverData);

            const enrichedRadio = mapDriverNames(radioData, driverData);
            const filteredRadio = enrichedRadio.filter(
                (radio) => radio.driver_number.toString() === driverNumber.toString()
            );

            setTeamRadio(filteredRadio);
            setLoading(false);
        };

        fetchData();
    }, [sessionKey, driverNumber]);

    if (loading) {
        return <p>Loading Team Radio...</p>;
    }

    if (!teamRadio.length) {
        return <p>No team radio available for this driver.</p>;
    }

    const driver = drivers.find((d) => d.driver_number.toString() === driverNumber.toString());
    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : "Unknown Driver";

    const toggleAccordion = () => setIsExpanded(!isExpanded);

    return (
        <div className="accordion mt-4" id="driverRadioAccordion">
            <div className="accordion-item">
                <h2 className="accordion-header" id="heading-driver-radio">
                    <button
                        onClick={toggleAccordion}
                        className={`accordion-button ${!isExpanded ? "collapsed" : ""} text-uppercase`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#collapse-driver-radio"
                        aria-expanded={isExpanded}
                        aria-controls="collapse-driver-radio"
                    >
                        Team Radio: {driverName}
                    </button>
                </h2>
                <div
                    id="collapse-driver-radio"
                    className={`accordion-collapse collapse ${isExpanded ? "show" : ""}`}
                    aria-labelledby="heading-driver-radio"
                    data-bs-parent="#driverRadioAccordion"
                >
                    <div className="accordion-body d-flex flex-column align-items-center gap-3">
                        {teamRadio.map((radio, index) => (
                            <audio
                                key={index}
                                controls
                                src={radio.recording_url}
                                className="w-100 w-md-75 w-lg-50"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverTeamRadio;
