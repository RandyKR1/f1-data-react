import React, { useEffect, useState } from "react";

const TimedAlert = ({ message, duration = 8000, className = "alert-warning" }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), duration);
        return () => clearTimeout(timer);
    }, [duration]);

    if (!visible) return null;

    return (
        <div className={`alert ${className} text-center`} role="alert">
            {message}
        </div>
    );
};

export default TimedAlert;
