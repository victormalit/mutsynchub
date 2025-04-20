import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { toPng } from "html-to-image";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const MAX_POINTS = 100;

interface Props {
  data: any[];
}

const DynamicChart: React.FC<Props> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");
  const [aggregation, setAggregation] = useState<"avg" | "sum" | "min" | "max">("avg");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");

  const keys = data.length > 0 ? Object.keys(data[0]) : [];

  const numericKeys = keys.filter((key) =>
    data.some((row) => !isNaN(parseFloat(row[key])))
  );
  const stringKeys = keys.filter((key) =>
    data.every((row) => typeof row[key] === "string" && isNaN(parseFloat(row[key])))
  );

  useEffect(() => {
    setXAxis(stringKeys[0] || "");
    setYAxis(numericKeys[0] || "");
  }, [data]);

  if (!xAxis || !yAxis || data.length === 0) return null;

  const chunkSize = Math.ceil(data.length / MAX_POINTS);
  const chunkedData: number[] = [];
  const xLabels: string[] = [];

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const values = chunk.map((row) => parseFloat(row[yAxis])).filter((v) => !isNaN(v));

    let agg = 0;
    if (aggregation === "avg") {
      agg = values.reduce((a, b) => a + b, 0) / values.length || 0;
    } else if (aggregation === "sum") {
      agg = values.reduce((a, b) => a + b, 0);
    } else if (aggregation === "min") {
      agg = Math.min(...values);
    } else if (aggregation === "max") {
      agg = Math.max(...values);
    }

    chunkedData.push(parseFloat(agg.toFixed(2)));

    const first = chunk[0]?.[xAxis];
    const last = chunk[chunk.length - 1]?.[xAxis];

    const label =
      !isNaN(Date.parse(first)) && !isNaN(Date.parse(last))
        ? `${format(new Date(first), "MMM d")}–${format(new Date(last), "MMM d")}`
        : `${first} → ${last}`;

    xLabels.push(label);
  }

  const chartData = {
    labels: xLabels,
    datasets: [
      {
        label: `${yAxis} (${aggregation} per ${chunkSize} rows)`,
        data: chunkedData,
        borderColor: "#6366F1",
        backgroundColor: chartType === "bar" ? "#C4B5FD" : "#818CF844",
        fill: chartType === "line",
      },
    ],
  };

  const pieData = {
    labels: xLabels,
    datasets: [
      {
        label: yAxis,
        data: chunkedData,
        backgroundColor: xLabels.map(
          (_, i) => `hsl(${(i * 360) / xLabels.length}, 70%, 70%)`
        ),
      },
    ],
  };

  const exportChart = () => {
    if (!chartRef.current) return;
    toPng(chartRef.current).then((dataUrl) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `chart-${yAxis}.png`;
      link.click();
    });
  };

  return (
    <div ref={chartRef} className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="text-lg font-semibold text-gray-800">Custom Chart</div>

        <div className="flex flex-wrap gap-2">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
            className="border text-sm rounded px-2 py-1"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            {chunkedData.length <= 20 && <option value="pie">Pie</option>}
          </select>

          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="border text-sm rounded px-2 py-1"
          >
            {stringKeys.map((key) => (
              <option key={key} value={key}>
                X: {key}
              </option>
            ))}
          </select>

          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="border text-sm rounded px-2 py-1"
          >
            {numericKeys.map((key) => (
              <option key={key} value={key}>
                Y: {key}
              </option>
            ))}
          </select>

          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value as any)}
            className="border text-sm rounded px-2 py-1"
          >
            <option value="avg">Avg</option>
            <option value="sum">Sum</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>

          <button
            onClick={exportChart}
            className="bg-indigo-600 text-white text-sm px-3 py-1 rounded hover:bg-indigo-700"
          >
            Export PNG
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        📊 {data.length} rows → {chunkedData.length} points (≈ {chunkSize} rows each)
      </p>

      {chartType === "line" && <Line data={chartData} options={{ responsive: true }} />}
      {chartType === "bar" && <Bar data={chartData} options={{ responsive: true }} />}
      {chartType === "pie" && <Pie data={pieData} />}
    </div>
  );
};

export default DynamicChart;
