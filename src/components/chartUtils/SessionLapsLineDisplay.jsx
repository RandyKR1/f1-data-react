import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";
import { lapToMinFormat } from "../../utilities";

const TEAMMATE_DASH = "6 3";

// One entry per toggle in LineVisibilityToggle. Sectors get their own dash
// pattern so they can be told apart when several metrics are shown.
const METRICS = [
    { key: "lapTime", label: "Lap", width: 2 },
    { key: "sector1", label: "S1", width: 1.5, dash: "2 2" },
    { key: "sector2", label: "S2", width: 1.5, dash: "8 3" },
    { key: "sector3", label: "S3", width: 1.5, dash: "12 3 2 3" },
];

/**
 * Lap-by-lap times for any number of drivers.
 * @param data - rows of { lapNumber, `${driverNumber}_${metricKey}`: seconds }
 * @param selected - driver numbers to draw
 * @param styles - Map of driver_number -> { name, color, secondary }
 * @param visibleLines - { lapTime, sector1, sector2, sector3 } booleans
 */
const SessionLapsLineDisplay = ({ data, selected, styles, visibleLines }) => {
    const metrics = METRICS.filter((m) => visibleLines[m.key]);
    const singleMetric = metrics.length === 1;

    return (
        <ResponsiveContainer width="100%" height={450}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="7 7" />
                <XAxis dataKey="lapNumber" label={{ value: "Lap", position: "insideBottomRight", offset: -5 }} />
                <YAxis tickFormatter={lapToMinFormat} domain={["dataMin - 2", "dataMax + 2"]} />
                {/* Sort tooltip rows fastest first */}
                <Tooltip formatter={(value) => lapToMinFormat(value)} itemSorter={(item) => item.value} />
                <Legend verticalAlign="bottom" />

                {selected.flatMap((num) => {
                    const style = styles.get(num);
                    if (!style) return [];
                    return metrics.map((metric) => {
                        // Teammates share a team colour: with one metric the second
                        // teammate is dashed; with several, dashes mark the metric
                        // and the second teammate is drawn lighter instead.
                        const dash = singleMetric || !metric.dash
                            ? (style.secondary ? TEAMMATE_DASH : undefined)
                            : metric.dash;
                        return (
                            <Line
                                key={`${num}_${metric.key}`}
                                type="monotone"
                                dataKey={`${num}_${metric.key}`}
                                name={`${style.name} ${metric.label}`}
                                stroke={style.color}
                                strokeWidth={metric.width}
                                strokeDasharray={dash}
                                strokeOpacity={style.secondary && !singleMetric ? 0.6 : 1}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                            />
                        );
                    });
                })}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SessionLapsLineDisplay;
