import React, {useEffect, useState} from "react";
import { getCarData } from "../api";

const CarData = ({sessionKey}) => {
    const [carData, setCarData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCarData = async () => {
            if (!sessionKey) return;

            const data = await getCarData(sessionKey);
            console.log("Car Data:", data)
            setCarData(data);
            setLoading(false)
        }

        fetchCarData();
    }, [sessionKey]);

    if(loading){
        return <p>Loading drivers...</p>
    }

    return(
        <></>
    )
}

export default CarData;
