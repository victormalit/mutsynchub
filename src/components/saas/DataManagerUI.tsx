import { useEffect, useRef, useState } from "react";
import FileUploader from "@/components/saas/FileUploader";
import KPISummary from "@/components/saas/KPISummary";
import DynamicChart from "@/components/saas/DynamicChart";
import AutoEDASummary from "@/components/saas/AutoEDASummary";
import SourceTabs from "@/components/saas/SourceTabs";
import InsightAssistant from "@/components/saas/InsightAssistant";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

const DataManagerUI = () => {
  const [data, setData] = useState<any[]>([]);
  const [sourceTab, setSourceTab] = useState("upload");
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Load from sessionStorage if data exists
  useEffect(() => {
    const saved = sessionStorage.getItem("mutsync-data");
    if (saved) setData(JSON.parse(saved));
  }, []);

  // Save to sessionStorage on data change
  useEffect(() => {
    if (data.length > 0) {
      sessionStorage.setItem("mutsync-data", JSON.stringify(data));
    }
  }, [data]);

  const exportToPDF = () => {
    if (!dashboardRef.current) return;
    toPng(dashboardRef.current).then((img) => {
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(img, "PNG", 10, 10, 190, 0);
      pdf.save("dashboard-report.pdf");
    });
  };

  const renderSchemaCards = () => {
    if (data.length === 0) return null;

    const firstRow = data[0];
    const columnNames = Object.keys(firstRow);

    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">Dataset Schema Overview</h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {columnNames.map((col, idx) => {
            const value = firstRow[col];
            const type = typeof value;
            return (
              <div key={idx} className="bg-white border border-gray-200 rounded-md px-4 py-2 shadow-sm">
                <div className="text-sm font-medium text-gray-800">{col}</div>
                <div className="text-xs text-gray-500 italic">{type}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      id="data-manager"
      className="bg-white text-gray-900 py-20 px-6 md:px-12 lg:px-20"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6">Data Manager</h2>
        <p className="text-center mb-8 text-gray-600">
          Upload your data or connect a source to explore instant insights.
        </p>

        {/* Tabs for data sources */}
        <SourceTabs current={sourceTab} onChange={setSourceTab} />

        {/* Show uploader if 'upload' tab is active */}
        {sourceTab === "upload" && <FileUploader onDataParsed={setData} />}

        {/* Coming soon message for other sources */}
        {sourceTab !== "upload" && (
          <p className="text-sm text-center text-gray-500 mb-8">
            Integration for {sourceTab} coming soon!
          </p>
        )}

        {/* Dashboard Visuals */}
        <div ref={dashboardRef}>
          {data.length > 0 && renderSchemaCards()}

          <KPISummary data={data} />
          <AutoEDASummary data={data} />

          {data.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <DynamicChart data={data} />
                <DynamicChart data={data} />
              </div>

              <InsightAssistant data={data} />
            </>
          )}
        </div>

        {/* Export PDF Button */}
        {data.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={exportToPDF}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
            >
              Export Dashboard as PDF
            </button>
          </div>
        )}
      </div>
    </section>

    
  );
};

export default DataManagerUI;
