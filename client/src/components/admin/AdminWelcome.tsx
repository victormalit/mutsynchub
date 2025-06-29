import React, { useState } from 'react';
import AnalyticsChart from '../analytics/AnalyticsChart';

const sampleTenantData = [
  { name: 'Acme Corp', users: 320, revenue: 24000, syncs: 120 },
  { name: 'Beta Inc', users: 210, revenue: 18000, syncs: 90 },
  { name: 'Delta LLC', users: 150, revenue: 12000, syncs: 60 },
  { name: 'Gamma Ltd', users: 400, revenue: 30000, syncs: 150 },
];

const sampleCacheStats = {
  hits: 1240,
  misses: 87,
  hitRate: '93.5%',
};

const sampleDataCleaning = {
  jobs: 42,
  errors: 2,
  lastRun: '2025-06-23 14:10',
};

const sampleQueryTypes = [
  { type: 'Forecasting', count: 32 },
  { type: 'Pattern Detection', count: 21 },
  { type: 'Correlation', count: 17 },
  { type: 'Summary', count: 12 },
];

type TenantName = 'Acme Corp' | 'Beta Inc';

const sampleTenantDetails: Record<TenantName, {
  users: number;
  revenue: number;
  syncs: number;
  jobs: { type: string; status: string; started: string }[];
  trend: { users: string; revenue: string; syncs: string };
}> = {
  'Acme Corp': {
    users: 320,
    revenue: 24000,
    syncs: 120,
    jobs: [
      { type: 'Sync', status: 'Running', started: '2m ago' },
      { type: 'Analysis', status: 'Completed', started: '1h ago' },
    ],
    trend: { users: '+5%', revenue: '+8%', syncs: '-2%' },
  },
  'Beta Inc': {
    users: 210,
    revenue: 18000,
    syncs: 90,
    jobs: [
      { type: 'Sync', status: 'Completed', started: '10m ago' },
      { type: 'Analysis', status: 'Error', started: '3h ago' },
    ],
    trend: { users: '+2%', revenue: '+3%', syncs: '+1%' },
  },
  // ...more tenants...
};

const AdminWelcome: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleTenantClick = (name: string) => {
    setSelectedTenant(name);
    setShowDetails(true);
  };

  const closeDetails = () => setShowDetails(false);

  return (
    <div className={
      `w-full min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 ` +
      (darkMode ? 'dark' : '') +
      ' p-8 flex flex-col gap-8'
    }>
      {/* Theme Toggle & Notification Bell */}
      <div className="flex justify-end gap-4 mb-2">
        <button
          className="bg-white/80 rounded-full p-2 shadow hover:bg-blue-100 transition"
          title="Toggle Dark/Light Mode"
          onClick={() => setDarkMode((d) => !d)}
        >
          <span role="img" aria-label="theme">{darkMode ? '🌙' : '☀️'}</span>
        </button>
        <div className="relative">
          <button className="bg-white/80 rounded-full p-2 shadow hover:bg-blue-100 transition" title="Notifications">
            <span role="img" aria-label="bell">🔔</span>
          </button>
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </div>
      </div>
      {/* Header and Key Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-2">Welcome, Super Admin!</h1>
          <p className="text-lg text-blue-100">Monitor, manage, and grow your platform with real-time insights.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-800 transition">Add Tenant</button>
          <button className="bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-purple-800 transition">Sync All Data</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold text-blue-700 mb-1">Tenants</div>
          <div className="text-4xl font-extrabold text-blue-900 mb-1">42</div>
          <div className="text-xs text-gray-500">Active Organizations</div>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold text-purple-700 mb-1">Revenue</div>
          <div className="text-4xl font-extrabold text-purple-900 mb-1">$128K</div>
          <div className="text-xs text-gray-500">This Year</div>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold text-green-700 mb-1">Active Users</div>
          <div className="text-4xl font-extrabold text-green-900 mb-1">1,234</div>
          <div className="text-xs text-gray-500">Across All Tenants</div>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold text-yellow-700 mb-1">Sync Jobs</div>
          <div className="text-4xl font-extrabold text-yellow-900 mb-1">87</div>
          <div className="text-xs text-gray-500">Running</div>
        </div>
      </div>
      <div className="w-full max-w-5xl mx-auto">
        <AnalyticsChart />
      </div>
      {/* New Sections: Tenant Comparison, System Monitoring, Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Tenant Comparison */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10">
          <h2 className="font-bold mb-4 text-blue-900 text-lg">Tenant Comparison</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-blue-700">
                <th className="text-left py-2">Tenant</th>
                <th className="text-right py-2">Users</th>
                <th className="text-right py-2">Revenue</th>
                <th className="text-right py-2">Syncs</th>
                <th className="text-right py-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sampleTenantData.map((t) => (
                <tr
                  key={t.name}
                  className="border-t border-blue-100 hover:bg-blue-50/40 cursor-pointer"
                  onClick={() => handleTenantClick(t.name)}
                >
                  <td className="py-2 font-semibold">{t.name}</td>
                  <td className="py-2 text-right">{t.users}</td>
                  <td className="py-2 text-right">${t.revenue.toLocaleString()}</td>
                  <td className="py-2 text-right">{t.syncs}</td>
                  <td className="py-2 text-right">
                    <span className={
                      (sampleTenantDetails[t.name as TenantName]?.trend.users?.startsWith('+') ? 'text-green-600' : 'text-red-600')
                    }>
                      {sampleTenantDetails[t.name as TenantName]?.trend.users}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* System Monitoring */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10 flex flex-col gap-6">
          <div>
            <h2 className="font-bold mb-2 text-blue-900 text-lg">Cache Stats</h2>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-700">{sampleCacheStats.hits}</div>
                <div className="text-xs text-gray-500">Hits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">{sampleCacheStats.misses}</div>
                <div className="text-xs text-gray-500">Misses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{sampleCacheStats.hitRate}</div>
                <div className="text-xs text-gray-500">Hit Rate</div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-bold mb-2 text-blue-900 text-lg">Data Cleaning</h2>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-700">{sampleDataCleaning.jobs}</div>
                <div className="text-xs text-gray-500">Jobs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700">{sampleDataCleaning.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">{sampleDataCleaning.lastRun}</div>
                <div className="text-xs text-gray-500">Last Run</div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-bold mb-2 text-blue-900 text-lg">Query Types</h2>
            <ul className="space-y-1">
              {sampleQueryTypes.map((q) => (
                <li key={q.type} className="flex justify-between">
                  <span>{q.type}</span>
                  <span className="font-semibold text-blue-700">{q.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Actions & Job Monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10">
          <h2 className="font-bold mb-4 text-blue-900 text-lg">Run Analysis</h2>
          <form className="flex flex-col gap-4">
            <select className="border rounded px-3 py-2">
              <option>All Tenants</option>
              {sampleTenantData.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
            <select className="border rounded px-3 py-2">
              <option>Forecasting</option>
              <option>Pattern Detection</option>
              <option>Correlation</option>
              <option>Summary</option>
            </select>
            <button className="bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-800 transition">Run Analysis</button>
          </form>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10">
          <h2 className="font-bold mb-4 text-blue-900 text-lg">Analysis & Cleaning Jobs</h2>
          <ul className="divide-y">
            <li className="py-2 flex justify-between"><span>Sync job for <b>Acme Corp</b></span><span className="text-xs text-green-700">Running</span></li>
            <li className="py-2 flex justify-between"><span>Analysis for <b>Beta Inc</b></span><span className="text-xs text-blue-700">Completed</span></li>
            <li className="py-2 flex justify-between"><span>Cleaning for <b>Delta LLC</b></span><span className="text-xs text-yellow-700">Pending</span></li>
            <li className="py-2 flex justify-between"><span>ML job for <b>Gamma Ltd</b></span><span className="text-xs text-red-700">Error</span></li>
          </ul>
        </div>
      </div>
      {/* Tenant Drilldown Modal */}
      {showDetails && selectedTenant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 focus:outline-none"
              onClick={closeDetails}
              aria-label="Close"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-2 text-blue-900">{selectedTenant} Details</h3>
            <div className="mb-4">
              <div className="text-lg font-semibold">Users: {sampleTenantDetails[selectedTenant as TenantName].users}</div>
              <div className="text-lg font-semibold">Revenue: ${sampleTenantDetails[selectedTenant as TenantName].revenue.toLocaleString()}</div>
              <div className="text-lg font-semibold">Syncs: {sampleTenantDetails[selectedTenant as TenantName].syncs}</div>
              <div className="text-sm text-gray-500 mb-2">Trends: Users {sampleTenantDetails[selectedTenant as TenantName].trend.users}, Revenue {sampleTenantDetails[selectedTenant as TenantName].trend.revenue}, Syncs {sampleTenantDetails[selectedTenant as TenantName].trend.syncs}</div>
            </div>
            <h4 className="font-bold mb-2 text-blue-800">Recent Jobs</h4>
            <ul className="divide-y">
              {sampleTenantDetails[selectedTenant as TenantName].jobs.map((job, idx) => (
                <li key={idx} className="py-2 flex justify-between">
                  <span>{job.type}</span>
                  <span className={
                    job.status === 'Running' ? 'text-green-700 animate-pulse' :
                    job.status === 'Completed' ? 'text-blue-700' :
                    'text-red-700'
                  }>{job.status}</span>
                  <span className="text-xs text-gray-400">{job.started}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWelcome;
