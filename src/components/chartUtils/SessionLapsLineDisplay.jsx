import React from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, Legend,
    ResponsiveContainer, CartesianGrid
} from "recharts";
import { lapToMinFormat } from "../../utilities";

const SessionLapsLineDisplay = ({ data, visibleLines, compareMode, driver1, driver2 }) => (
    <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="lapNumber" label={{ value: "Lap", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "Time", angle: -90, position: "insideLeft" }} tickFormatter={lapToMinFormat} domain={["dataMin - 2", "dataMax + 2"]} />
            <Tooltip formatter={(value) => lapToMinFormat(value)} />
            <Legend verticalAlign="top" height={36} />

            {visibleLines.lapTime && (
                <Line type="monotone" dataKey="lapDuration1" stroke="#8884d8" fill="#8884d8" name={`${driver1} Lap Time`} dot connectNulls />
            )}
            {visibleLines.sector1 && (
                <Line type="monotone" dataKey="sector1_1" stroke="#82ca9d" name={`${driver1} Sector 1`} dot={false} connectNulls fillOpacity={0.3} />
            )}
            {visibleLines.sector2 && (
                <Line type="monotone" dataKey="sector2_1" stroke="#ffc658" name={`${driver1} Sector 2`} dot={false} connectNulls fillOpacity={0.3} />
            )}
            {visibleLines.sector3 && (
                <Line type="monotone" dataKey="sector3_1" stroke="#ff7300" name={`${driver1} Sector 3`} dot={false} connectNulls fillOpacity={0.3} />
            )}

            {compareMode && visibleLines.lapTime && (
                <Line type="monotone" dataKey="lapDuration2" stroke="#413ea0" fill="#413ea0" name={`${driver2} Lap Time`} dot connectNulls />
            )}
            {compareMode && visibleLines.sector1 && (
                <Line type="monotone" dataKey="sector1_2" stroke="#008000" name={`${driver2} Sector 1`} dot={false} connectNulls fillOpacity={0.3} />
            )}
            {compareMode && visibleLines.sector2 && (
                <Line type="monotone" dataKey="sector2_2" stroke="#ff6347" name={`${driver2} Sector 2`} dot={false} connectNulls fillOpacity={0.3} />
            )}
            {compareMode && visibleLines.sector3 && (
                <Line type="monotone" dataKey="sector3_2" stroke="#ffa500" name={`${driver2} Sector 3`} dot={false} connectNulls fillOpacity={0.3} />
            )}
        </LineChart>
    </ResponsiveContainer>
);

export default SessionLapsLineDisplay;
