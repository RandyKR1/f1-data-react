import React from "react";

const CompareToggle = ({ compareMode, onToggle }) => (
    <div className="mb-3">
        <label>
            <input
                type="checkbox"
                checked={compareMode}
                onChange={onToggle}
            />{" "}
            Compare Two Drivers
        </label>
    </div>
);

export default CompareToggle;
