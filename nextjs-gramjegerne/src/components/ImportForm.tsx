import { useState } from "react";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  name: string;
  id?: string;
  error?: string;
}

interface ExcelRow {
  name: string;
  size?: string;
  weight?: string;
  unit?: string;
  calories?: string;
  category?: string;
  [key: string]: string | undefined;
}

export default function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [completedLines, setCompletedLines] = useState(0);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults([]);
    setProgress(0);
    setCompletedLines(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      const totalItems = jsonData.length;
      setTotalLines(totalItems);

      // Process items in batches
      const batchSize = 10;
      let processedResults: ImportResult[] = [];

      for (let i = 0; i < totalItems; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);

        try {
          const response = await fetch("/api/importItems", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(batch),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const { results: batchResults } = await response.json();
          processedResults = [...processedResults, ...batchResults];

          // Update progress
          const currentCompleted = Math.min(i + batch.length, totalItems);
          setCompletedLines(currentCompleted);
          setProgress(Math.round((currentCompleted / totalItems) * 100));
          setResults(processedResults); // Update results after each batch
        } catch (error) {
          console.error(`Error processing batch:`, error);
          // Add failed results for this batch
          const failedResults = batch.map((item) => ({
            success: false,
            name: item.name,
            error:
              error instanceof Error ? error.message : "Failed to process item",
          }));
          processedResults = [...processedResults, ...failedResults];

          // Still update progress even for failed items
          const currentCompleted = Math.min(i + batch.length, totalItems);
          setCompletedLines(currentCompleted);
          setProgress(Math.round((currentCompleted / totalItems) * 100));
          setResults(processedResults);
        }
      }

      // Final update of results
      setResults(processedResults);

      // Check if all items were successful
      if (processedResults.every((r) => r.success)) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
      setResults([
        {
          success: false,
          name: "Import",
          error: "Failed to process Excel file",
        },
      ]);
    } finally {
      setImporting(false);
      setProgress(100);
      setCompletedLines(totalLines);
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

      {importing && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p>Importing... {progress}%</p>
            <p className="text-sm text-gray-600">
              {completedLines} / {totalLines} lines processed
            </p>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5">
            <div
              className="bg-accent h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h3>Import Results:</h3>
          <div className="text-sm text-white mb-2">
            Successfully imported: {results.filter((r) => r.success).length} /{" "}
            {results.length} items
          </div>
          <ul className="mt-2 max-h-60 overflow-y-auto">
            {results.map((result, index) => (
              <li
                key={index}
                className={`${
                  result.success ? "text-green-500" : "text-red-500"
                } py-1`}
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
