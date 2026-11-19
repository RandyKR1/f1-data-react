import { buildDriverMap, getDriverName as getNameFromMap } from "../../utilities";

const LongestStintByCompound = ({ stints, drivers }) => {
    if (!stints?.length || !drivers?.length) return null;

    const driverMap = buildDriverMap(drivers);
    const getDriverName = (driver_number) => getNameFromMap(driverMap, driver_number);

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
            <table className="table table-light table-striped">
                <thead>
                    <tr>
                        <th>Compound</th>
                        <th>Driver</th>
                        <th>Laps</th>
                    </tr>
                </thead>
                <tbody>
                    {longestStints.map((stint) => (
                        <tr key={stint.compound}>
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

export default LongestStintByCompound;
