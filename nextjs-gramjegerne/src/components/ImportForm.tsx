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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults([]);
    setProgress(0);

    try {
      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      // First, collect and create all missing categories
      const uniqueCategories = new Set(
        jsonData
          .map((item) => item.category)
          .filter((category): category is string => !!category),
      );

      console.log("Categories to check:", Array.from(uniqueCategories));

      // Create missing categories first
      const categoryResponse = await fetch("/api/validateCategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: Array.from(uniqueCategories),
        }),
      });

      if (!categoryResponse.ok) {
        throw new Error("Failed to validate/create categories");
      }

      const { categoryMap } = await categoryResponse.json();
      console.log("Category mapping:", categoryMap);

      // Now process items with the correct category IDs
      let processedResults: ImportResult[] = [];
      const CHUNK_SIZE = 20;

      for (let i = 0; i < jsonData.length; i += CHUNK_SIZE) {
        const chunk = jsonData.slice(i, i + CHUNK_SIZE);

        // Map categories to their IDs
        const mappedChunk = chunk.map((item) => ({
          ...item,
          categoryId: item.category ? categoryMap[item.category] : undefined,
        }));

        const response = await fetch("/api/importItems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mappedChunk),
        });

        if (!response.ok) {
          throw new Error(`Import failed at item ${i + 1}`);
        }

        const { results } = await response.json();
        processedResults = [...processedResults, ...results];

        setProgress(Math.round(((i + chunk.length) / jsonData.length) * 100));
      }

      setResults(processedResults);
      if (processedResults.every((r) => r.success)) {
        onSuccess();
      }
    } catch (error) {
      console.error("Import error:", error);
      setResults([
        {
          success: false,
          name: "Import",
          error:
            error instanceof Error ? error.message : "Unknown import error",
        },
      ]);
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

      {importing && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p>Importing... {progress}%</p>
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
