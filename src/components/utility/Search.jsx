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

    const handleSessionNav = () => {
      const { session_type, session_key } = selectedSessionObj;
      let path = "";

      if (session_type === "Race") path = `/race-results/${session_key}`;
      else if (session_type === "Qualifying") path = `/qualy-results/${session_key}`;
      else if (session_type === "Practice") path = `/practice-results/${session_key}`;
      else path = `/results/${session_key}`; // fallback

      navigate(path);
    }

    console.log(selectedSessionObj)
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
        <h2 className="mb-4 text-center">Search F1 Race Data</h2>

        {/* Track Dropdown */}
        <div className="mb-3">
          <label className="form-label">Track:</label>
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="form-select"
          >
          <option value="">Select a track</option>
            {[...new Set(meetings.map((meet) => meet.location))].map((meet) => (
            <option key={meet} value={meet}>{meet}</option>
          ))}
          </select>
    </div>

        {/* Year Dropdown */}
        {selectedTrack && (
        <div>
          <label className="form-label">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="form-select"
          >
            <option value="">Select a year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Session Dropdown */}
        {selectedYear && (
        <div className="mb-3">
          <label className="form-label">Session:</label>
          <select
            value={selectedSessionKey}
            onChange={handleSessionChange}
            className="form-select"
          >
            <option value="">Select a session</option>
              {sessions.map((session) => (
                <option key={session.session_key} value={session.session_key}>
                  {new Date(session.date_start).toLocaleDateString()} - {session.session_name}
                </option>
            ))}
            </select>
        </div>
      )}

      {selectedSessionKey && (
        <div className="d-grid">
          <button onClick={handleSessionNav} className="btn btn-primary">
            View Race Data
          </button>
        </div>
      )}
    </div>
  </div>
</div>

  );
};

export default Search;