import { useEffect, useState } from "react";
import { getSessions, getMeetings } from "../../api";
import { useNavigate } from "react-router-dom";
import DropdownSelector from "./DropdownSelector";

const Search = () => {
  const [meetings, setMeetings] = useState([]);
  const [years, setYears] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [selectedSessionObj, setSelectedSessionObj] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeeting = async () => {
      const data = await getMeetings();
      setMeetings(data);
    };
    fetchMeeting();
  }, []);

  useEffect(() => {
    if (!selectedTrack) return;

    const filteredYears = Array.from(
      new Set(
        meetings
          .filter((meet) => meet.location === selectedTrack)
          .map((meet) => new Date(meet.date_start).getFullYear())
      )
    );
    setYears(filteredYears);
  }, [selectedTrack, meetings]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!selectedTrack || !selectedYear) return;
      const data = await getSessions();
      const filtered = data.filter(
        (sess) =>
          sess.location === selectedTrack &&
          new Date(sess.date_start).getFullYear() === parseInt(selectedYear)
      );
      setSessions(filtered);
    };
    fetchSessions();
  }, [selectedTrack, selectedYear]);

  const handleSessionChange = (sessionKey) => {
    setSelectedSessionKey(sessionKey);
    const selected = sessions.find(
      (s) => s.session_key.toString() === sessionKey
    );
    setSelectedSessionObj(selected);
  };

  const handleSessionNav = () => {
    const { session_type, session_key } = selectedSessionObj;
    let path = "";

    if (session_type === "Race") path = `/race-results/${session_key}`;
    else if (session_type === "Qualifying") path = `/qualy-results/${session_key}`;
    else if (session_type === "Practice") path = `/practice-results/${session_key}`;
    else path = `/results/${session_key}`;

    navigate(path);
  };

  const uniqueTracks = [...new Set(meetings.map((meet) => meet.location))];

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        {/* ✅ Use Bootstrap for spacing and alignment */}
        <div className="col-md-6 d-flex flex-column gap-3 ">

          {/* ✅ Replaced native <select> with DropdownSelector */}
          <DropdownSelector
            title="Select a Track"
            options={uniqueTracks}
            selected={selectedTrack}
            onSelect={setSelectedTrack}
          />

          {selectedTrack && (
            <DropdownSelector
              title="Select a Year"
              options={years.map((year) => ({
                label: year.toString(),
                value: year.toString()
            }))}
              selected={selectedYear}
              onSelect={setSelectedYear}
          />
          )}

          {selectedYear && (
            <DropdownSelector
              title="Select a Session"
              options={sessions.map((s) => ({
                label: `${new Date(s.date_start).toLocaleDateString()} - ${s.session_name}`,
                value: s.session_key.toString()
              }))}
              selected={
                sessions.find((s) => s.session_key.toString() === selectedSessionKey)?.session_name
              }
              onSelect={handleSessionChange}
            />
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
