// components/saas/AutoEDASummary.tsx
interface Props {
    data: any[];
  }
  
  const AutoEDASummary = ({ data }: Props) => {
    if (!data || data.length === 0) return null;
  
    const numRows = data.length;
    const sample = data[0];
    const columns = Object.keys(sample);
  
    const columnTypes: Record<string, string> = {};
  
    columns.forEach((col) => {
      const values = data.map((row) => row[col]).slice(0, 50);
      const nums = values.filter((v) => !isNaN(parseFloat(v)));
      const dates = values.filter((v) => new Date(v).toString() !== "Invalid Date");
      const uniques = new Set(values);
  
      if (nums.length > 30) columnTypes[col] = "Numeric";
      else if (dates.length > 30) columnTypes[col] = "Date";
      else if (uniques.size < 10) columnTypes[col] = "Categorical";
      else columnTypes[col] = "Text";
    });
  
    const counts = {
      numeric: Object.values(columnTypes).filter((t) => t === "Numeric").length,
      date: Object.values(columnTypes).filter((t) => t === "Date").length,
      cat: Object.values(columnTypes).filter((t) => t === "Categorical").length,
      text: Object.values(columnTypes).filter((t) => t === "Text").length,
    };
  
    return (
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-bold text-blue-800 mb-4">🔍 Smart Data Overview</h3>
        <p className="text-gray-700 mb-4">
          Your dataset contains <strong>{numRows}</strong> rows and <strong>{columns.length}</strong> columns.
        </p>
        <ul className="list-disc pl-6 text-sm text-gray-800 space-y-2">
          <li>
            <strong>{counts.numeric}</strong> numeric column{counts.numeric !== 1 ? "s" : ""}
          </li>
          <li>
            <strong>{counts.date}</strong> date/time column{counts.date !== 1 ? "s" : ""}
          </li>
          <li>
            <strong>{counts.cat}</strong> categorical column{counts.cat !== 1 ? "s" : ""}
          </li>
          <li>
            <strong>{counts.text}</strong> free text column{counts.text !== 1 ? "s" : ""}
          </li>
        </ul>
      </div>
    );
  };
  
  export default AutoEDASummary;
  