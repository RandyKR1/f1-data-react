import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { getMeetings, getSessionsFor } from "../../api";
import { SESSION_ROUTES } from "../../utilities";
import DropdownSelector from "./DropdownSelector";

const Search = () => {
  const [meetings, setMeetings] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Meeting list is cached in api.js, so this only hits the network once per page load
  useEffect(() => {
    let ignore = false;
    getMeetings()
      .then((data) => { if (!ignore) setMeetings(data); })
      .catch(() => { if (!ignore) setError("Could not load tracks. Please refresh to try again."); });
    return () => { ignore = true; };
  }, []);

  // Ask the API for just this track + year instead of downloading every session
  useEffect(() => {
    if (!selectedTrack || !selectedYear) return;
    let ignore = false;
    getSessionsFor(selectedTrack, selectedYear)
      .then((data) => { if (!ignore) setSessions(data); })
      .catch(() => { if (!ignore) setError("Could not load sessions. Please try again."); });
    return () => { ignore = true; };
  }, [selectedTrack, selectedYear]);

  const tracks = useMemo(
    () => [...new Set(meetings.map((meet) => meet.location))],
    [meetings]
  );

  const years = useMemo(
    () => [
      ...new Set(
        meetings
          .filter((meet) => meet.location === selectedTrack)
          .map((meet) => meet.year ?? new Date(meet.date_start).getFullYear())
      ),
    ],
    [meetings, selectedTrack]
  );

  const selectedSession = sessions.find((s) => s.session_key.toString() === selectedSessionKey);
  // undefined for session types without a results page (button is disabled)
  const route = selectedSession && SESSION_ROUTES[selectedSession.session_type];

  // Changing an earlier choice clears the later ones
  const handleTrackSelect = (track) => {
    setSelectedTrack(track);
    setSelectedYear("");
    setSelectedSessionKey("");
    setSessions([]);
    setError(null);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSelectedSessionKey("");
    setSessions([]);
    setError(null);
  };

  return (
    <motion.div
      className="container py-4 col-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3 }}>
      <div className="row justify-content-center">
        <div className="col-md-10 d-flex flex-column gap-3">
          {error && <div className="alert alert-danger mb-0">{error}</div>}
          <DropdownSelector
            title="Select a Track"
            options={tracks}
            selected={selectedTrack}
            onSelect={handleTrackSelect}
          />
          {selectedTrack && (
            <DropdownSelector
              title="Select a Year"
              options={years.map((year) => ({
                label: year.toString(),
                value: year.toString()
              }))}
              selected={selectedYear}
              onSelect={handleYearSelect}
            />
          )}

          {selectedYear && (
            <DropdownSelector
              title="Select a Session"
              options={sessions.map((s) => ({
                label: `${new Date(s.date_start).toLocaleDateString()} - ${s.session_name}`,
                value: s.session_key.toString()
              }))}
              selected={selectedSession?.session_name}
              onSelect={setSelectedSessionKey}
            />
          )}
          {selectedSession && (
            <div className="d-grid">
              <button
                onClick={() => navigate(`/${route}/${selectedSession.session_key}`)}
                className="btn btn-primary"
                disabled={!route}
              >
                {route ? "View Race Data" : "Results not available for this session"}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Search;
