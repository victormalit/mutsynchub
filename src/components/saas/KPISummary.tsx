import React from "react";

interface Props {
  data: any[];
}

const KPISummary: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const sample = data[0];
  const columnKeys = Object.keys(sample);

  // Calculate numeric averages
  const summary = columnKeys.map((key) => {
    const numericVals = data
      .map((row) => parseFloat(row[key]))
      .filter((val) => !isNaN(val));

    const average =
      numericVals.length > 0
        ? (numericVals.reduce((a, b) => a + b, 0) / numericVals.length).toFixed(2)
        : "N/A";

    return {
      name: key,
      average,
    };
  });

  return (
    <div className="my-10">
      <h3 className="text-xl font-semibold mb-6">KPI Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {summary.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 transition hover:shadow-md"
          >
            <p className="text-gray-600 text-sm font-medium truncate">
              {item.name}
            </p>
            <p className="text-indigo-600 text-xl font-bold mt-1">{item.average}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPISummary;
