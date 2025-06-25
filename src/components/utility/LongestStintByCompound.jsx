import React from "react";

const LongestStintByCompound = ({ stints, drivers, driverNumber }) => {
    if (!stints?.length || !drivers?.length || !driverNumber) return null;

    const driver = drivers.find((d) => d.driver_number === Number(driverNumber));
    const driverStints = stints.filter((stint) => stint.driver_number === Number(driverNumber));

    const getLongestStintByCompound = () => {
        const result = {};
        for (let stint of driverStints) {
            const length = stint.lap_end - stint.lap_start + 1;
            const compound = stint.compound;
            if (!result[compound] || length > result[compound].length) {
                result[compound] = {
                    length,
                    compound,
                };
            }
        }
        return Object.values(result);
    };

    const longestStints = getLongestStintByCompound();

    return (
        <div className="col-md-12 text-center">
            <p className="fw-bold fs-3">Longest Stint by Compound – {driver?.last_name}</p>
            <table className="table table-light table-striped">
                <thead>
                    <tr>
                        <th>Compound</th>
                        <th>Laps</th>
                    </tr>
                </thead>
                <tbody>
                    {longestStints.map((stint, index) => (
                        <tr key={index}>
                            <td>{stint.compound}</td>
                            <td>{stint.length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LongestStintByCompound;
