import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const data = [
  { name: 'Mon', co2: 400, ch4: 240, no2: 240 },
  { name: 'Tue', co2: 300, ch4: 139, no2: 221 },
  { name: 'Wed', co2: 200, ch4: 980, no2: 229 },
  { name: 'Thu', co2: 278, ch4: 390, no2: 200 },
  { name: 'Fri', co2: 189, ch4: 480, no2: 218 },
  { name: 'Sat', co2: 239, ch4: 380, no2: 250 },
  { name: 'Sun', co2: 349, ch4: 430, no2: 210 },
];

const GHGChart = () => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
          <YAxis stroke="rgba(255,255,255,0.6)" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }} 
          />
          <Legend />
          <Area type="monotone" dataKey="co2" stackId="1" stroke="#8884d8" fill="#8884d8" name="CO2 (ppm)" />
          <Area type="monotone" dataKey="ch4" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Methane (ppb)" />
          <Area type="monotone" dataKey="no2" stackId="1" stroke="#ffc658" fill="#ffc658" name="NO2 (ppb)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GHGChart;
