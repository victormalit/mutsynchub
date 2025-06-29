import React, { useEffect, useState } from 'react';
import { runQuery, getQueryHistory } from '../api/analytics';
import { useAuth } from '../hooks/useAuth';
import AnalyticsChart from '@/components/analytics/AnalyticsChart';

type QueryHistoryItem = {
  id?: string | number;
  name: string;
  description?: string;
};

const sampleSyncStatus = [
  { name: 'Salesforce', status: 'Success', lastSync: '2025-06-24 09:12', quality: '98%' },
  { name: 'HubSpot', status: 'Running', lastSync: '2025-06-24 10:01', quality: '95%' },
  { name: 'Stripe', status: 'Error', lastSync: '2025-06-23 22:45', quality: 'N/A' },
];

const sampleCachedResults = [
  { query: 'Monthly active users', date: '2025-06-23', summary: '1,234 users' },
  { query: 'Revenue last 6 months', date: '2025-06-22', summary: '$12,000' },
];

const AnalyticsDashboardLanding: React.FC = () => {
  const { user, loading } = useAuth();
  const token = user?.token || '';
  const orgId = user?.orgId || '';

  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nlResult, setNlResult] = useState<any>(null);
  const [nlLoading, setNlLoading] = useState(false);

  useEffect(() => {
    // Fetch query history on mount
    if (orgId && token) {
    getQueryHistory(orgId, token)
      .then((res: { data: QueryHistoryItem[] }) => setHistory(res.data))
      .catch(() => setHistory([]));
    }
  }, [orgId, token]);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryLoading(true);
    setError(null);
    try {
      const res = await runQuery({ query, orgId }, token);
      setQueryResult(res.data);
    } catch (err: any) {
      setError('Failed to run query.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleNLQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setNlLoading(true);
    setNlResult(null);
    setError(null);
    // Simulate backend call
    setTimeout(() => {
      setNlResult({
        chartType: 'bar',
        data: [
          { name: 'Jan', value: 120 },
          { name: 'Feb', value: 150 },
          { name: 'Mar', value: 180 },
        ],
        summary: 'Sample result for your query.'
      });
      setNlLoading(false);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 dark:from-zinc-900 dark:via-blue-900 dark:to-purple-900 flex flex-col items-center justify-start py-10 px-2">
      <section className="mb-10 text-center w-full max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-3 text-white drop-shadow-lg">Analytics Hub</h1>
        <p className="text-lg text-blue-100 mb-6">Welcome, <span className="font-semibold text-blue-200">{user?.name}</span>! Here’s your data at a glance.</p>
      </section>
      {/* Key Metrics */}
      <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <div className="bg-gradient-to-br from-blue-700 to-purple-600 text-white rounded-2xl shadow-xl p-8 flex flex-col items-center border border-blue-900/30">
          <div className="text-xl font-bold mb-2">Current Plan</div>
          <div className="text-4xl font-extrabold mb-2 capitalize text-yellow-200">{user?.plan}</div>
          <div className="text-base">All features for your business</div>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold mb-2 text-blue-700">Active Schedules</div>
          <span className="text-4xl font-extrabold text-blue-900 mb-1">12</span>
          <span className="text-xs text-gray-500">This Month</span>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col items-center border border-blue-900/10">
          <div className="text-xl font-bold mb-2 text-blue-700">Reports</div>
          <span className="text-4xl font-extrabold text-blue-900 mb-1">37</span>
          <span className="text-xs text-gray-500">Generated</span>
        </div>
      </section>
      {/* Analytics Chart */}
      <section className="w-full max-w-4xl mx-auto mb-10">
        <AnalyticsChart />
      </section>
      {/* Sync Status & Data Quality */}
      <section className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {sampleSyncStatus.map((s) => (
          <div key={s.name} className="bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10 flex flex-col gap-2">
            <div className="text-lg font-bold text-blue-900">{s.name}</div>
            <div className={
              s.status === 'Success' ? 'text-green-700' :
              s.status === 'Running' ? 'text-yellow-700 animate-pulse' :
              'text-red-700'
            }>
              Status: {s.status}
            </div>
            <div className="text-xs text-gray-500">Last Sync: {s.lastSync}</div>
            <div className="text-xs text-gray-500">Data Quality: {s.quality}</div>
          </div>
        ))}
      </section>
      {/* Natural Language Query */}
      <section className="w-full max-w-3xl mx-auto bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10 mb-10">
        <form onSubmit={handleNLQuery} className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ask a question about your data..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={nlLoading}
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded" disabled={nlLoading || !query}>
            {nlLoading ? 'Running...' : 'Ask'}
          </button>
        </form>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {nlResult && (
          <div className="bg-white rounded shadow p-4 mt-2">
            <h2 className="font-bold mb-2">Result</h2>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(nlResult, null, 2)}</pre>
            <div className="text-sm text-gray-600 mt-2">{nlResult.summary}</div>
          </div>
        )}
      </section>
      {/* Cached Results */}
      <section className="w-full max-w-3xl mx-auto bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10 mb-10">
        <h2 className="font-bold mb-4 text-blue-900 text-lg">Cached Results</h2>
        <ul className="divide-y">
          {sampleCachedResults.map((r, idx) => (
            <li key={idx} className="py-2 flex justify-between items-center">
              <span className="font-semibold text-blue-800">{r.query}</span>
              <span className="text-xs text-gray-500">{r.date}</span>
              <span className="text-xs text-gray-700">{r.summary}</span>
            </li>
          ))}
        </ul>
      </section>
      {/* Query History Section */}
      <section className="w-full max-w-3xl mx-auto bg-white/90 rounded-2xl shadow-lg p-6 border border-blue-900/10">
        <h2 className="font-bold mb-4 text-blue-900 text-lg">Query History</h2>
        <ul className="divide-y">
          {history.map((item, idx) => (
            <li key={item.id || idx} className="py-2">
              <div className="font-semibold text-blue-800">{item.name}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AnalyticsDashboardLanding;
