import { useEffect, useState } from "react";
import { getSessions, getMeetings } from "../../api";
import { Navigate, useNavigate } from "react-router-dom";

const Search = () => {
    const [meetings, setMeetings] = useState([]);
    const [years, setYears] = useState([])
    const [sessions, setSessions] = useState([]);

    const [selectedTrack, setSelectedTrack] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSessionKey, setSelectedSessionKey] = useState("");
    const [selectedSessionObj, setSelectedSessionObj] = useState(null);


    const navigate = useNavigate();

    useEffect(() => {
        const fetchMeeting = async () => {
            const data = await getMeetings()
            setMeetings(data);  
        }
        fetchMeeting();
    },[]);

    useEffect(() => {
        if (!selectedTrack) return;

        const filteredYears = Array.from(
            new Set( //A Set will remove any duplicates in case a track was run twice in the same year
                meetings
                    .filter((meet) => meet.location === selectedTrack) //Race location data filtered to match the track selected
                    .map((meet) => new Date(meet.date_start).getFullYear()) //Converting date to a numbered year
            )
        );
        setYears(filteredYears)
    }, [selectedTrack, meetings]);

    useEffect(() => {
        const fetchSessions = async () => {
            if (!selectedTrack || !selectedYear) return;
            console.log("Track:", selectedTrack)
            const data = await getSessions();
            const filtered = data.filter((sess) => 
                sess.location === selectedTrack && new Date(sess.date_start).getFullYear() === parseInt(selectedYear)
            );
            setSessions(filtered);
        };
        fetchSessions();
    }, [selectedTrack, selectedYear]);

    const handleSessionChange = (e) => {
      const sessionKey = e.target.value;
      setSelectedSessionKey(sessionKey);
      const selected = sessions.find(
        (s) => s.session_key.toString() === sessionKey);
        setSelectedSessionObj(selected);
    };


  return (
    <div>
      <h2>Search F1 Race Data</h2>

      {/* Track Dropdown */}
      <label>Track:</label>
      <select value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}>
        <option value="">Select a track</option>
        {[...new Set(meetings.map((meet) => meet.location))].map((meet) => (
          <option key={meet} value={meet}>{meet}</option>
        ))}
      </select>

      {/* Year Dropdown */}
      {selectedTrack && (
        <>
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">Select a year</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </>
      )}

      {/* Session Dropdown with enhanced label */}
      {selectedYear && (
        <>
          <label>Session:</label>
          <select value={selectedSessionKey} onChange={handleSessionChange}>
            <option value="">Select a session</option>
            {sessions.map((session) => (
              <option key={session.session_key} value={session.session_key}>
                {new Date(session.date_start).toLocaleDateString()} – {session.meeting_name || session.session_type}
              </option>
            ))}
          </select>
        </>
      )}

      {selectedSessionKey && (
        <button onClick={() => navigate(`/results/${selectedSession}`)}>
            View Race Data
        </button>
      )

      }
    </div>
  );
};

export default Search;