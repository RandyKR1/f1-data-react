import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { loadSessionData, getErrorMessage } from "../../api";
import { FALLBACK_RESULTS_MESSAGE, getTopDrivers } from "../../utilities";
import Search from "../utility/Search";
import ClassificationTable from "../utility/ClassificationTable";
import LapTimeChart from "../utility/LapTimeChart";
import Weather from "../general/Weather";
import RaceControl from "../general/RaceControl";
import TeamRadio from "../general/TeamRadio";
import DismissibleAlert from "../utility/DismissibleAlert";
import ErrorMessage from "../utility/ErrorMessage";

const QualifyingResults = () => {
    const { sessionKey } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 750);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        // Ignore responses from an older sessionKey that arrive after we've moved on
        let ignore = false;
        setLoading(true);
        setError(null);
        loadSessionData(sessionKey)
            .then((result) => { if (!ignore) setData(result); })
            .catch((err) => { if (!ignore) setError(getErrorMessage(err)); })
            .finally(() => { if (!ignore) setLoading(false); });
        return () => { ignore = true; };
    }, [sessionKey]);

    if (loading || (!data && !error)) {
        return <div className="text-center mt-5">Loading Qualifying Results...</div>;
    }
    if (error) return <ErrorMessage message={error} />;

    const { session, meeting, drivers, laps, results, isOfficial } = data;
    // Without laps the page still shows results, weather, race control and
    // radio; the lap chart shows a note instead (e.g. Baku 2025 Qualifying).
    if (!drivers.length) {
        return <ErrorMessage message="No driver data is available for this session yet." />;
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="container">
            {!isOfficial && <DismissibleAlert message={FALLBACK_RESULTS_MESSAGE} />}
            <motion.div
                className="mt-5 mb-4"
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 2 }}>
                <h1 className="page-title">{meeting?.meeting_official_name ?? "Grand Prix"}</h1>
                <h2 className="page-subtitle">{session.session_name} Results</h2>
            </motion.div>

            <div className="row">
                <Search />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="table-responsive">
                        <ClassificationTable
                            type="Qualifying"
                            results={results}
                            isOfficial={isOfficial}
                            laps={laps}
                            drivers={drivers}
                            sessionKey={sessionKey}
                            sessionName={session.session_name}
                        />
                    </div>
                </motion.div>
            </div>

            <div className="row">
                <motion.div
                    className="col-md-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <LapTimeChart drivers={drivers} laps={laps} initialDrivers={getTopDrivers(results)} />
                </motion.div>
            </div>

            <div className="row mt-5 mb-2 d-flex justify-content-center">
                <motion.div
                    className="col-md-12"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <Weather sessionKey={sessionKey} />
                </motion.div>

                <motion.div
                    className="row"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <div className="col-md-6 text-center mb-4">
                        <p className="fs-3">Team Radio Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <TeamRadio sessionKey={sessionKey} drivers={drivers} />
                        </div>
                    </div>
                    <div className="col-md-6 text-center mb-4">
                        <p className="fs-3">Race Control Messages</p>
                        <div style={{ maxHeight: "265px", overflowY: "auto", scrollbarWidth: "thin" }}>
                            <RaceControl sessionKey={sessionKey} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {showScrollTop && (
                <motion.button
                    onClick={scrollToTop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="btn btn-dark position-fixed"
                    style={{
                        bottom: "40px",
                        right: "40px",
                        zIndex: 1000,
                        borderRadius: "50%",
                        padding: "0.75rem 1rem",
                    }}
                    aria-label="Back to top"
                >
                    ↑
                </motion.button>
            )}
        </div>
    )
}

export default QualifyingResults
