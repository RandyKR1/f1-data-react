import React, { useState, useEffect } from "react";
import { getTeamRadio, getDrivers } from "../../api";
import { mapDriverNames, groupByDriverName } from "../../utilities";

const TeamRadio = ({ sessionKey }) => {
    const [teamRadio, setTeamRadio] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true);
    const [expandedDriver, setExpandedDriver] = useState(null); // team dropdown state

    //fetch team radios based on session
    useEffect(() => {
        if (!sessionKey) return;
        const fetchTeamRadio = async () => {
            const data = await getTeamRadio(sessionKey);
            setTeamRadio(data);
            setLoading(false);
        }
        fetchTeamRadio();
    }, [sessionKey]);

    //fetch drivers based on session
    useEffect(() => {
        if (!sessionKey) return;
        const fetchDrivers = async () => {
            const data = await getDrivers(sessionKey);
            setDrivers(data);
            setLoading(false);
        };
        fetchDrivers();
    }, [sessionKey])


    if (loading || !drivers.length || !teamRadio.length) {
        return <p>Loading Team Radio Data... Try Refreshing</p>;
    }

    //toggles the team radio dropdown
    const toggleTeam = (driver) => {
        setExpandedDriver((prev) => (prev === driver ? null : driver));
    };


    const addTeamToTeamRadio = mapDriverNames(teamRadio, drivers)
    const radioByDriver = groupByDriverName(addTeamToTeamRadio)
    // console.log("Radio By Driver:", radioByDriver)


    return (
        <div className="accordion" id="raceControlAccordion">
            {Object.entries(radioByDriver).map(([driver, radios, index]) => (
                <div className="accordion-item" key={index}>
                    <h2 className="accordion-header" id={`heading-${index}`}>
                    <button
                        onClick={() => toggleTeam(driver)}
                        className="accordion-button collapsed text-uppercase"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#collapse-${index}`}
                        aria-expanded="false"
                        aria-controls={`collapse-${index}`}
                    >
                        {driver}
                    </button>
                    </h2>
                    {expandedDriver === driver && (
                        <ul className="flex flex-col justify-center items-center space-y-2 list-unstyled">
                            {radios.map((radio, index) => (
                                <li key={index}>
                                    <audio controls src={radio.recording_url} className="w-72 md:w-45 lg:w-72 mt-3" />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}


export default TeamRadio;