import React, {useState, useEffect} from "react";
import { getStints, getDrivers } from "../api";
import { getMaxBy } from "../utilities";

const Stints = ({sessionKey}) => {
    const [stints, setStints] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    //fetch stints based on session    
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


    //fetch drivers based on session
    useEffect(() => {
        if (!sessionKey) return;
        const fetchDrivers = async () => {
            const data = await getDrivers(sessionKey);
            setDrivers(data);
            setLoading(false);
        };
        fetchDrivers();
    }, [sessionKey])

    if (loading || !drivers.length || !stints.length) {
        return <p>Loading Stints Data...</p>;
    }

    const addNameToStints = stints.map((stint) => {
        const driver = drivers.find((d) => d.driver_number === stint.driver_number);
        return{
            ...stint, driver_name: driver?.last_name || "Unkown Driver Name"
        };
    })

    //loops over addNameToStints and creates new result
    const stintWithDriverName = addNameToStints.reduce((results, stint) => {
        const driverName = stint.driver_name;
        if (!results[driverName]){
            results[driverName] = [];
        }
    
        results[driverName].push(stint);
        return results;
    }, {})

    const allStintsWithLength = [];
    Object.entries(stintWithDriverName).forEach(([driverName, stints]) => {
        stints.forEach((stint) => {
            const stintLength = stint.lap_end - stint.lap_start + 1;
            allStintsWithLength.push({
                ...stint, driverName, stintLength
            })
        })
    })
    const longestStint = getMaxBy(allStintsWithLength, "stintLength")
    console.log("Longest Stint", longestStint)
    console.log("Longest Stint", longestStint.stintLength)


    return(
        <div>
            <p>Longest Stint: {longestStint.driverName}, {longestStint.stintLength} Laps. ({longestStint.compound})</p>
        </div>
    )
}

export default Stints;