import React from 'react';

interface TableData {
  [key: string]: string | number | boolean;
}

interface Props {
    data: TableData[];
  }
  
  const DataPreviewTable: React.FC<Props> = ({ data }) => {
    if (!data || data.length === 0) return null;
  
    const headers = Object.keys(data[0]);
  
    return (
      <div className="table-responsive mt-4">
        <table className="table table-striped table-bordered">
          <thead className="table-dark">
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, i) => (
              <tr key={i}>
                {headers.map((header) => (
                  <td key={header}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <small className="text-muted">Showing first 10 rows</small>
      </div>
    );
  };
  
  export default DataPreviewTable;
  