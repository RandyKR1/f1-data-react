import React, {useState, useEffect} from "react";
import { getPosition } from "../../api";

const Position = ({sessionKey, drivers}) => {
    const [position, setPosition] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionKey) return;

        const fetchPosition = async () => {
            const data = await getPosition(sessionKey);
            console.log("Position Data:", data);
            setPosition(data);
            setLoading(false);
        }
        fetchPosition();

    }, [sessionKey]);


    if (loading || !drivers.position) {
        return <p>Loading Position Data...</p>;
    }


    return(
        <div>
        </div>
    )
}

export default Position;