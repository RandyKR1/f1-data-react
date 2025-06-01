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
    <div className="mb-4">
      <label htmlFor="driver-select" className="block font-semibold mb-2">
        Select a Driver:
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {drivers.map((driver) => (
          <button
            key={driver.driver_number}
            onClick={() => handleSelect(driver)}
            className="text-left p-2 bg-white rounded shadow hover:bg-gray-100"
          >
            {driver.last_name} <span className="text-sm text-gray-500">#{driver.driver_number}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DriverSelector;
