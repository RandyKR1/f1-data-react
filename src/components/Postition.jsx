import React, {useState, useEffect} from "react";
import { getPosition } from "../api";
import { filterDupes } from "../utilities";

const Position = () => {
    const [position, setPosition] = useState([])
    const [loading, setLoading] = useState(true);
    const [session_key, setSessionKey] = useState('');

    useEffect(() => {
        if (!session_key) return;

        const fetchPosition = async () => {
            const data = await getPosition(session_key);
            setPosition(data);
            setLoading(false);
        }
        fetchPosition();

    }, [session_key]);


    if(loading){
        return <p>Loading Position Data...</p>
    }

    // const filteredPositionData = filterDupes(position, "session_key");

    return(
        <div>
        </div>
    )
}

export default Position;