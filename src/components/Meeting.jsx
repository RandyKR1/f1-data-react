import React, {useState, useEffect} from "react";
import { getMeetings } from "../api";
import { filterDupes } from "../utilities";

const Meeting = () => {
    const [meeting, setMeeting] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeeting = async () => {
            const data = await getMeetings();
            setMeeting(data);
            console.log(data);
            setLoading(false);
        }

        fetchMeeting();
    }, []);

    if(loading){
        return <p>Loading Meetings...</p>
    }

    const filteredMeetings = filterDupes(meeting, "meeting_key")

    return(
        <div>
            <h1>Meetings</h1>

            <ul>
                {filteredMeetings.map((meeting) =>
                <li key={meeting.session_key}>
                    {meeting.location || `Meeting with Session Key: ${meeting.meeting_key}`}
                </li>
                )}
            </ul>
        </div>
    )
}

export default Meeting;