import { useEffect, useState } from "react";
import { getLocation, getDrivers, getSessions } from "../api";

//Creating Search component that allows users to narrow down their search first by location/track, then by year, then session, then optionally driver.

/**
 * Step 1: Create arrays of drop down options for the user to choose from using State.
 * Step 2: Create state management to store the selected track, year, session, driver.
 * Step 3: Create useEffect to load locations for dropdown.
 * Step 4: Create conditional state logic to load next dropdown based on selected track location.
 */

const Search = () => {
    const [locations, setLocations] = useState([]);
    const [years, setYears] = useState([])
    const [sessions, setSessions] = useState([]);
    const [drivers, setDrivers] = useState([]);

    const [selectedTrack, setSelectedTrack] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedDriver, setSelectedDriver] = useState("");

    useEffect(() => {
        const fetchLocations = async () => {
            const data = await getLocation()
            setLocations(data);  
        }
        fetchLocations();
    },[]);

    useEffect(() => {
        if (!selectedTrack) return;

        const filteredYears = Array.from(
            new Set( //A Set will remove any duplicates in case a track was run twice in the same year
                locations
                    .filter((loc) => loc.location === selectedTrack) //Race location data filtered to match the track selected
                    .map((loc) => new Date(loc.date_start).getFullYear()) //Converting date to a numbered year
            )
        );
        setYears(filteredYears)
    }, [selectedTrack, locations]);

    useEffect(() => {
        const fetchSessions = async () => {
            if (!selectedTrack || !selectedYear) return;
            const data = await getSessions();
            const filtered = data.filter((sess) => 
                sess.location === selectedTrack && new Date(sess.date).getFullYear() === parseInt(selectedYear)
            );
            setSessions(filtered);
        };
        fetchSessions();
    }, [selectedTrack, selectedYear]);

    useEffect(() => {
        const fetchDrivers = async () => {
            if(!selectedSession) return;
            const data = getDrivers();
            setDrivers(data);
        };
        fetchDrivers();
    }, [selectedSession]);

    return(
        <div>
            <h1>Formula 1 Race Data</h1>
        </div>
    )
}