import { useMemo } from "react";
import { getReadableTextColor } from "../../utilities";

/**
 * Pick any number of drivers, grouped by team.
 * Clicking a team name toggles both of its drivers.
 * @param drivers - drivers that have lap data
 * @param selected - selected driver numbers
 * @param onChange - called with the new array of driver numbers
 * @param styles - Map of driver_number -> { color } (team colour)
 */
const DriverPicker = ({ drivers, selected, onChange, styles }) => {
    const teams = useMemo(() => {
        const byTeam = new Map();
        for (const d of drivers) {
            const team = d.team_name ?? "Other";
            if (!byTeam.has(team)) byTeam.set(team, []);
            byTeam.get(team).push(d);
        }
        return [...byTeam.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [drivers]);

    const selectedSet = new Set(selected);

    const toggleDriver = (num) =>
        onChange(selectedSet.has(num) ? selected.filter((n) => n !== num) : [...selected, num]);

    const toggleTeam = (teamDrivers) => {
        const nums = teamDrivers.map((d) => d.driver_number);
        const allSelected = nums.every((n) => selectedSet.has(n));
        onChange(
            allSelected
                ? selected.filter((n) => !nums.includes(n))
                : [...new Set([...selected, ...nums])]
        );
    };

    return (
        <div className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2">
                <span className="fw-semibold">
                    Drivers ({selected.length}/{drivers.length})
                </span>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onChange(drivers.map((d) => d.driver_number))}
                >
                    All
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onChange([])}
                >
                    Clear
                </button>
            </div>

            <div className="d-flex flex-wrap gap-2">
                {teams.map(([team, teamDrivers]) => (
                    <div key={team} className="btn-group btn-group-sm" role="group" aria-label={team}>
                        <button
                            type="button"
                            className="btn btn-light border"
                            style={{ borderLeft: `4px solid ${styles.get(teamDrivers[0].driver_number)?.color}` }}
                            onClick={() => toggleTeam(teamDrivers)}
                            title={`Toggle ${team}`}
                        >
                            {team}
                        </button>
                        {teamDrivers.map((d) => {
                            const isOn = selectedSet.has(d.driver_number);
                            const color = styles.get(d.driver_number)?.color;
                            return (
                                <button
                                    key={d.driver_number}
                                    type="button"
                                    className="btn btn-light border"
                                    aria-pressed={isOn}
                                    onClick={() => toggleDriver(d.driver_number)}
                                    title={`${d.first_name} ${d.last_name} #${d.driver_number}`}
                                    style={
                                        isOn
                                            ? { backgroundColor: color, borderColor: color, color: getReadableTextColor(color) }
                                            : undefined
                                    }
                                >
                                    {d.name_acronym ?? `#${d.driver_number}`}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverPicker;
