import React, { useState } from "react";
import Papa from "papaparse";

interface Props {
  onDataParsed: (data: any[]) => void;
}

const FileUploader: React.FC<Props> = ({ onDataParsed }) => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          onDataParsed(result.data);
        },
      });
    }
  };

  return (
    <div className="mb-4">
      <label className="form-label fw-semibold">Upload CSV File</label>
      <input type="file" accept=".csv" onChange={handleFileChange} className="form-control" />
      {fileName && <p className="text-muted mt-2">Uploaded: {fileName}</p>}
    </div>
  );
};

export default FileUploader;
