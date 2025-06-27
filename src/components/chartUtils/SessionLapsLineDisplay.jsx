import React from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";
import { lapToMinFormat } from "../../utilities";

const SessionLapsLineDisplay = ({ data, visibleLines, compareMode, driver1, driver2 }) => (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="7 7" />
            <XAxis dataKey="lapNumber" label={{ value: "Lap", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "Time", position: "insideLeft"}} tickFormatter={lapToMinFormat} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip formatter={(value) => lapToMinFormat(value)} />
            <Legend verticalAlign="top" height={36} />

            {visibleLines.lapTime && (
                <Line type="monotone" dataKey="lapDuration1" stroke="#1b4f72" name={`${driver1} Lap Time`} dot={false} connectNulls />
            )}
            {visibleLines.sector1 && (
                <Line type="monotone" dataKey="sector1_1" stroke="#2874a6" name={`${driver1} Sector 1`} dot={false} connectNulls />
            )}
            {visibleLines.sector2 && (
                <Line type="monotone" dataKey="sector2_1" stroke="#3498db" name={`${driver1} Sector 2`} dot={false} connectNulls />
            )}
            {visibleLines.sector3 && (
                <Line type="monotone" dataKey="sector3_1" stroke="#85c1e9" name={`${driver1} Sector 3`} dot={false} connectNulls />
            )}

            {compareMode && visibleLines.lapTime && (
                <Line type="monotone" dataKey="lapDuration2" stroke="#e10600" fill="#1e8449" name={`${driver2} Lap Time`} dot={false} connectNulls />
            )}
            {compareMode && visibleLines.sector1 && (
                <Line type="monotone" dataKey="sector1_2" stroke="#f44336" name={`${driver2} Sector 1`} dot={false} connectNulls />
            )}
            {compareMode && visibleLines.sector2 && (
                <Line type="monotone" dataKey="sector2_2" stroke="#ef5350" name={`${driver2} Sector 2`} dot={false} connectNulls />
            )}
            {compareMode && visibleLines.sector3 && (
                <Line type="monotone" dataKey="sector3_2" stroke="#ef9a9a" name={`${driver2} Sector 3`} dot={false} connectNulls />
            )}
        </LineChart>
    </ResponsiveContainer>
);

export default SessionLapsLineDisplay;
