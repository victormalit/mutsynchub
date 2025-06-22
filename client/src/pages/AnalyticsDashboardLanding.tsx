import React, { useEffect, useState } from 'react';
import { runQuery, getQueryHistory } from '../api/analytics';
import { useAuth } from '../hooks/useAuth';

type QueryHistoryItem = {
  id?: string | number;
  name: string;
  description?: string;
};

const AnalyticsDashboardLanding: React.FC = () => {
  const { user, loading } = useAuth();
  const token = user?.token || '';
  const orgId = user?.orgId || '';

  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <h2 className="text-3xl font-extrabold mb-2 text-blue-800">Sign in Required</h2>
          <p className="mb-6 text-gray-600">Please log in or sign up to access the Analytics Engine.</p>
          <div className="flex flex-col gap-4">
            {/* Import and use the SSOLogin component for SSO options */}
            {require('../components/ui/SSOLogin').default()}
            <span className="text-gray-400 text-xs my-2">or</span>
            <a href="#" onClick={() => window.dispatchEvent(new CustomEvent('open-login-dialog'))} className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded-lg shadow px-6">Login / Sign Up</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-2">Analytics Engine</h1>
        <p className="text-lg text-gray-600 mb-4">Unlock insights, drive growth. Welcome to your analytics hub.</p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-base text-gray-700">Welcome, <span className="font-semibold">{user?.name}</span> ({user?.role})</span>
          <span className="text-sm text-blue-700 bg-blue-100 rounded px-2 py-1">Plan: {user?.plan}</span>
        </div>
      </section>
      {/* Pricing & Metrics Section */}
      <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-700 to-purple-600 text-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-2xl font-bold mb-2">Current Plan</div>
          <div className="text-4xl font-extrabold mb-2 capitalize">{user?.plan}</div>
          <div className="text-lg">All features for your business</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="text-2xl font-bold mb-2 text-blue-700">Key Metrics</div>
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-800">12</span>
              <span className="text-xs text-gray-500">Active Schedules</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-800">37</span>
              <span className="text-xs text-gray-500">Reports</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-800">99%</span>
              <span className="text-xs text-gray-500">Uptime</span>
            </div>
          </div>
        </div>
      </section>
      <section className="mb-10">
        <form onSubmit={handleQuery} className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ask a question about your data..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={queryLoading}
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded" disabled={queryLoading || !query}>
            {queryLoading ? 'Running...' : 'Run Query'}
          </button>
        </form>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {queryResult && (
          <div className="bg-white rounded shadow p-4 mt-2">
            <h2 className="font-bold mb-2">Result</h2>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(queryResult, null, 2)}</pre>
          </div>
        )}
      </section>
      <section>
        <h2 className="font-bold mb-2">Query History</h2>
        <ul className="divide-y">
          {history.map((item, idx) => (
            <li key={item.id || idx} className="py-2">
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AnalyticsDashboardLanding;
