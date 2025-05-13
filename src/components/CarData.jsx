import React, {useEffect, useState} from "react";
import { filterDupes } from "../utilities";
import { getCarData } from "../api";

const CarData = () => {
    const [carData, setCarData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionKey, setSessionKey] = useState('');

    useEffect(() => {
        const fetchCarData = async () => {
            if (!sessionKey) return;

            const data = await getCarData(sessionKey);
            setCarData(data);
            setLoading(false)
        }

        fetchCarData();
    }, [sessionKey]);

    const filteredCarData = filterDupes(carData, "driver_number")

    if(loading){
        return <p>Loading drivers...</p>
    }

    return(
        <></>
    )
}

export default CarData;
