import React, {useState, useEffect} from "react";
import { getPit } from "../api";

const Pit = ({sessionKey}) => {
    const [pit, setPit] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchPit = async () => {
            const data = await getPit(sessionKey);
            setPit(data);
            setLoading(false);
        }
        fetchPit();

    }, [sessionKey]);


    if(loading){
        return <p>Loading Pit Data...</p>
    }


    return(
        <div>
        </div>
    )
}

export default Pit;