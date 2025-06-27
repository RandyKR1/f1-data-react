import React, { useState } from "react";

const TimedAlert = ({ message, className = "alert-warning" }) => {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className={`alert ${className} text-center d-flex justify-content-between align-items-center`} role="alert">
            <span className="flex-grow-1">{message}</span>
            <button
                type="button"
                className="btn-close ms-2"
                aria-label="Close"
                onClick={() => setVisible(false)}
            />
        </div>
    );
};

export default TimedAlert;
