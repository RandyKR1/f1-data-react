import React from "react";

const LineVisibilityToggle = ({ visibleLines, onToggle }) => {
    const labels = {
        lapTime: "Lap Time",
        sector1: "Sector 1",
        sector2: "Sector 2",
        sector3: "Sector 3",
    };

    return (
        <div className="mb-3 d-flex gap-3 flex-wrap">
            {Object.keys(visibleLines).map((key) => (
                <label key={key}>
                    <input
                        type="checkbox"
                        checked={visibleLines[key]}
                        onChange={() => onToggle(key)}
                        className="me-1"
                    />
                    {labels[key]}
                </label>
            ))}
        </div>
    );
};

export default LineVisibilityToggle;
