import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from "recharts";

// Sample analytics data (replace with real data later)
const data = [
  { name: "Jan", Users: 400, Reports: 24, Schedules: 12 },
  { name: "Feb", Users: 600, Reports: 30, Schedules: 15 },
  { name: "Mar", Users: 800, Reports: 45, Schedules: 18 },
  { name: "Apr", Users: 700, Reports: 40, Schedules: 20 },
  { name: "May", Users: 900, Reports: 50, Schedules: 22 },
  { name: "Jun", Users: 1100, Reports: 60, Schedules: 25 },
];

const AnalyticsChart: React.FC = () => (
  <div className="w-full h-80 bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10 mb-10">
    <h2 className="font-bold mb-4 text-blue-900 text-lg">User Activity & Reports Overview</h2>
    <ResponsiveContainer width="100%" height="90%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a21caf" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#a21caf" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: '#334155', fontWeight: 600 }} />
        <YAxis tick={{ fill: '#334155', fontWeight: 600 }} />
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ef" />
        <Tooltip contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e7ef' }} />
        <Legend />
        <Area type="monotone" dataKey="Users" stroke="#2563eb" fillOpacity={1} fill="url(#colorUsers)" />
        <Area type="monotone" dataKey="Reports" stroke="#a21caf" fillOpacity={1} fill="url(#colorReports)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default AnalyticsChart;
