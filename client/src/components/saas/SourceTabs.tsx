import React, { useState } from "react";

const TABS = [
  { key: "upload", label: "Upload File" },
  { key: "sheets", label: "Google Sheets" },
  { key: "postgres", label: "PostgreSQL" },
  { key: "shopify", label: "Shopify" },
];

interface Props {
  current: string;
  onChange: (key: string) => void;
}

const SourceTabs: React.FC<Props> = ({ current, onChange }) => {
  return (
    <div className="mb-6 flex flex-wrap justify-center gap-3">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-5 py-2 rounded-full font-medium transition ${
            current === tab.key
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SourceTabs;
