import React from "react";

const LongestStintByCompund = ({ stints, drivers }) => {
    if (!stints?.length || !drivers?.length) return null;

    const getDriverName = (driver_number) =>
        drivers.find((d) => d.driver_number === driver_number)?.last_name || "Unknown";

    const getLongestStintByCompound = () => {
        const result = {};
        for (let stint of stints) {
            const length = stint.lap_end - stint.lap_start + 1;
            const compound = stint.compound;
            if (!result[compound] || length > result[compound].length) {
                result[compound] = {
                    length,
                    driver: getDriverName(stint.driver_number),
                    compound,
                };
            }
        }
        return Object.values(result);
    };

    const longestStints = getLongestStintByCompound();

    return (
        <div className="col-md-12 text-center">
            <p className="fw-bold fs-3">Longest Stint By Compound</p>
            <table className="table table-light table-striped">
                <thead>
                    <tr>
                        <th>Compound</th>
                        <th>Driver</th>
                        <th>Laps</th>
                    </tr>
                </thead>
                <tbody>
                    {getLongestStintByCompound().map((stint, index) => (
                        <tr key={index}>
                            <td>{stint.compound}</td>
                            <td>{stint.driver}</td>
                            <td>{stint.length}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>



    );
};

export default LongestStintByCompund;
