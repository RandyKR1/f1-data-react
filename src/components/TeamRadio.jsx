import React, {useState, useEffect} from "react";
import { getTeamRadio } from "../api";
import { filterDupes } from "../utilities";

const TeamRadio = () => {
    const [teamRadio, setTeamRadio] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchTeamRadio = async () => {
            const data = await getTeamRadio(session_key);
            setTeamRadio(data);
            setLoading(false);
        }
        fetchTeamRadio();

    }, [session_key]);


    if(loading){
        return <p>Loading Team Radio Data...</p>
    }

    const filteredTeamRadio = filterDupes(teamRadio, "session_key");

    return(
        <div>
        </div>
    )
}

export default TeamRadio;