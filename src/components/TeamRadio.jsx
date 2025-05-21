import React, {useState, useEffect} from "react";
import { getTeamRadio, getDrivers } from "../api";

const TeamRadio = ({sessionKey}) => {
    const [teamRadio, setTeamRadio] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState(null);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchTeamRadio = async () => {
            const data = await getTeamRadio(sessionKey);
            setTeamRadio(data);
            setLoading(false);
        }
        fetchTeamRadio();

    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchDrivers = async () => {
            const data = await getDrivers(sessionKey);
            setDrivers(data);
            setLoading(false);
        };
    
        fetchDrivers();
    }, [sessionKey])


    if(loading){
        return <p>Loading Team Radio Data...</p>
    }

   const addTeamToTeamRadio = teamRadio.map((radio) => {
    const driver = drivers.find((d) => d.driver_number === radio.driver_number);
    return{
        ...radio, team_name: driver?.team_name || "Unkown Team Name"
    };
   })

   const radioByTeam = addTeamToTeamRadio.reduce((results, radio) => {
    const team = radio.team_name;
    if (!results[team]){
        results[team] = [];
    }
    
    results[team].push(radio);
    return results;
   }, {})

   console.log("Radio By Team:", radioByTeam)

   const toggleTeam = (team) => {
    setExpandedTeam((prev) => (prev === team ? null : team));
    };

    return (
    <div>
        {Object.entries(radioByTeam).map(([team, radios]) => (
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