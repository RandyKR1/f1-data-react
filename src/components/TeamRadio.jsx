import React, {useState, useEffect} from "react";
import { getTeamRadio, getDrivers } from "../api";
import { mapDriverNames, groupByDriverName } from "../utilities";

const TeamRadio = ({sessionKey}) => {
    const [teamRadio, setTeamRadio] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState(null); // team dropdown state

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
        return <p>Loading Team Radio Data...</p>;
    }

    //toggles the team radio dropdown
    const toggleTeam = (team) => {
        setExpandedTeam((prev) => (prev === team ? null : team));
    };


    const addTeamToTeamRadio = mapDriverNames(teamRadio, drivers)
    const radioByDriver = groupByDriverName(addTeamToTeamRadio)
    console.log("Radio By Driver:", radioByDriver)

    
    return (
    <div>
        {Object.entries(radioByDriver).map(([team, radios]) => (
        <div key={team}>
            <button onClick={() => toggleTeam(team)}>{team}</button>

            {expandedTeam === team && (
            <ul>
                {radios.map((radio, index) => (
                <li key={index}>
                    Driver #{radio.driver_number}
                    <audio controls src={radio.recording_url} />
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