import React, {useState, useEffect} from "react";
import { getTeamRadio } from "../api";

const TeamRadio = ({sessionKey}) => {
    const [teamRadio, setTeamRadio] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchTeamRadio = async () => {
            const data = await getTeamRadio(sessionKey);
            setTeamRadio(data);
            setLoading(false);
        }
        fetchTeamRadio();
        console.log("Team Radio Data:", teamRadio)

    }, [sessionKey]);


    if(loading){
        return <p>Loading Team Radio Data...</p>
    }

    console.log("Team Radio Data:", teamRadio)

    return(
        <div>
            {teamRadio.map((tr, index) =>
                <p key={index}>
                    <strong>Driver: {tr.driver_number}</strong> <br/> 
                    <a href={tr.recording_url} target="_blank" rel="noreferrer">Listen to Radio</a>
                </p>)}
        </div>
    )
}

export default TeamRadio;