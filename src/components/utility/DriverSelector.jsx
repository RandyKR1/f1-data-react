import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDrivers } from "../../api";
import { filterDupes } from "../../utilities"; // Optional utility

const DriverSelector = ({ sessionKey, selectedDriver, setSelectedDriver }) => {
  const [drivers, setDrivers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionKey) return;

    const fetchDrivers = async () => {
      const data = await getDrivers(sessionKey);
      // Optional: filter duplicates if needed
      setDrivers(filterDupes ? filterDupes(data, "driver_number") : data);
    };

    fetchDrivers();
  }, [sessionKey]);

  const handleSelect = (driver) => {
    setSelectedDriver?.(driver); // Optional state update
    navigate(`/results/${sessionKey}/driver/${driver.driver_number}`);
  };

  return (
    <div>
      <label htmlFor="driver-select">
        Select a Driver:
      </label>
      <div>
        {drivers.map((driver) => (
          <button
            key={driver.driver_number}
            onClick={() => handleSelect(driver)}
          >
            {driver.last_name} <span>#{driver.driver_number}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelector;
