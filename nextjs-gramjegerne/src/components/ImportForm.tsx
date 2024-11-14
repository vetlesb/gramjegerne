import { useState } from "react";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  name: string;
  id?: string;
  error?: string;
}

export default function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Send to API
      const response = await fetch("/api/importItems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });

      const { results } = await response.json();
      setResults(results);

      // If all successful, trigger refresh
      if (results.every((r: ImportResult) => r.success)) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        disabled={importing}
        className="button-secondary"
      />

      {importing && <p>Importing...</p>}

      {results.length > 0 && (
        <div className="mt-4">
          <h3>Import Results:</h3>
          <ul className="mt-2">
            {results.map((result, index) => (
              <li
                key={index}
                className={`${
                  result.success ? "text-green-500" : "text-red-500"
                }`}
              >
                {result.name}: {result.success ? "Success" : result.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
