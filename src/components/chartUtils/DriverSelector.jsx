import React from "react";

const DriverSelector = ({ id, label, drivers, selectedDriver, onChange, disabledDriver }) => (
    <div className="mb-3">
        <label htmlFor={id} className="form-label">{label}</label>
        <select
            id={id}
            className="form-select"
            value={selectedDriver}
            onChange={(e) => onChange(e.target.value)}
        >
            {drivers.map((name) => (
                <option
                    key={name}
                    value={name}
                    disabled={name === disabledDriver}
                >
                    {name}
                </option>
            ))}
        </select>
    </div>
);

export default DriverSelector;
