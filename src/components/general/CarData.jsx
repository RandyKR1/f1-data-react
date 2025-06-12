import React, {useEffect, useState} from "react";
import { getCarData } from "../../api";

const CarData = ({sessionKey}) => {
    const [carData, setCarData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    if (!sessionKey) return;
        const fetchCarData = async () => {
        const data = await getCarData(sessionKey);
        setCarData(data);
        setLoading(false);
    } 
    fetchCarData();
    }, [sessionKey]);

    if(loading || !carData.length){
        return <p>Loading drivers...</p>
    }

    console.log("Car Data:", carData)

    return(
        <></>
    )
}

export default CarData;
