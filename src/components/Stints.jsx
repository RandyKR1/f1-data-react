import React, {useState, useEffect} from "react";
import { getStints } from "../api";
import { filterDupes } from "../utilities";

const Stints = ({sessionKey}) => {
    const [stints, setStints] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchStints = async () => {
            const data = await getStints(sessionKey);
            console.log("Stint Data:", data)
            setStints(data);
            setLoading(false);
        } 
        fetchStints();

    }, [sessionKey]);


    if(loading){
        return <p>Loading Stints Data...</p>
    }

    return(
        <div>
        </div>
    )
}

export default Stints;