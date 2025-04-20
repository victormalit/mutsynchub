// components/saas/InsightAssistant.tsx
import { useState } from "react";
import DynamicChart from "@/components/saas/DynamicChart";

interface Props {
  data: any[];
}

const InsightAssistant = ({ data }: Props) => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Simulated smart insight
    const fakeInsight = `Based on your dataset, the top values in '${Object.keys(data[0])[0]}' correlate with the highest '${Object.keys(data[0])[1]}'.`;
    setResponse(fakeInsight);
    setShowChart(true);
  };

  return (
    <div className="bg-white mt-12 p-6 rounded-lg shadow border">
      <h3 className="text-xl font-bold text-indigo-800 mb-4">🧠 AI Insight Assistant</h3>

      <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data..."
          className="flex-1 border border-gray-300 rounded px-4 py-2"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Ask
        </button>
      </form>

      {response && (
        <div className="bg-blue-50 p-4 rounded mb-4 border text-sm text-gray-700">
          <strong>AI Insight:</strong> {response}
        </div>
      )}

      {showChart && <DynamicChart data={data} />}
    </div>
  );
};

export default InsightAssistant;
