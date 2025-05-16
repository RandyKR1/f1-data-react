    useEffect(() => {
        if(!selectedSession) return;
        
        const fetchDrivers = async () => {
                 console.log("Session:", selectedSession)
            const data = await getDrivers(selectedSession);
                console.log("Drivers fetched:", data);
            const filteredDrivers = filterDupes(data, "broadcast_name")
            console.log(filteredDrivers)
            setDrivers(data);
        };
        fetchDrivers();
    }, [selectedSession]);

          {/* Driver Dropdown */}
      {selectedSession && (
        <>
          <label>Driver:</label>
          <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
            <option value="">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver.broadcast_name} value={driver.broadcast_name}>
                {`${driver.last_name} (${driver.driver_number})`  || driver.driver_number}
              </option>
            ))}
          </select>
        </>
      )}