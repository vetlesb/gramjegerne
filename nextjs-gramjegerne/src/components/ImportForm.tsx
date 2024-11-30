import React, { useState } from "react";
import * as XLSX from "xlsx";
import { client } from "@/lib/sanity";

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
  image_url?: string;
  [key: string]: string | undefined;
}

export default function ImportForm({ onSuccess }: { onSuccess: () => void }) {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isImport, setIsImport] = useState(true);
  const [isClear, setIsClear] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      const CHUNK_SIZE = 20; // For item creation
      const IMAGE_BATCH_SIZE = 5; // For image uploads

      // Upload images in batches
      const imageUploadPromises = [];
      for (let i = 0; i < jsonData.length; i += IMAGE_BATCH_SIZE) {
        const imageBatch = jsonData.slice(i, i + IMAGE_BATCH_SIZE);
        const uploadPromises = imageBatch.map(async (item) => {
          const imageAssetId = item.image_url
            ? await uploadImageToSanity(item.image_url)
            : null;
          return {
            ...item,
            imageAssetId, // Add the uploaded image asset ID
            categoryId: item.category ? categoryMap[item.category] : undefined,
          };
        });
        const batchResults = await Promise.all(uploadPromises);
        imageUploadPromises.push(...batchResults);
      }

      // Now create items in chunks
      for (let i = 0; i < imageUploadPromises.length; i += CHUNK_SIZE) {
        const chunk = imageUploadPromises.slice(i, i + CHUNK_SIZE);

        const response = await fetch("/api/importItems", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          throw new Error(`Import failed at item ${i + 1}`);
        }

        const { results } = await response.json();
        processedResults = [...processedResults, ...results];

        setProgress(
          Math.round(((i + chunk.length) / imageUploadPromises.length) * 100),
        );
      }

      setResults(processedResults);
      if (processedResults.every((r) => r.success)) {
        onSuccess();
      }
    } catch (error) {
      const typedError = error as Error; // Assert that error is of type Error
      console.error("Import error:", typedError);
      setResults([
        {
          success: false,
          name: "Import",
          error: typedError.message,
        },
      ]);
    } finally {
      setImporting(false);
    }
  };

  const handleClearItems = async () => {
    const response = await fetch("/api/clearItems", {
      method: "DELETE",
    });

    if (response.ok) {
      setResults([{ success: true, name: "All items cleared." }]);
      onSuccess();
    } else {
      const error = await response.json();
      setResults([
        { success: false, name: "Clear failed", error: error.message },
      ]);
    }
  };

  const uploadImageToSanity = async (imageUrl: string) => {
    if (!imageUrl) return null; // Return null if no image URL is provided
    const maxRetries = 5; // Maximum number of retries
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
        }
        const blob = await response.blob();
        const asset = await client.assets.upload("image", blob, {
          filename: imageUrl.split("/").pop(), // Use the image filename
        });
        console.log(`Uploaded image: ${imageUrl}, Asset ID: ${asset._id}`); // Log the uploaded asset ID
        return asset._id; // Return the asset ID
      } catch (error) {
        const typedError = error as Error; // Assert that error is of type Error
        console.error("Error uploading image:", typedError);

        // Check if the error is a rate limit error
        if (typedError.message.includes("rate limit exceeded")) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 100; // Exponential backoff
          console.log(`Rate limit exceeded. Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime)); // Wait before retrying
        } else {
          return null; // Handle other errors appropriately
        }
      }
    }

    return null; // Return null if all retries fail
  };

  const handleExport = async () => {
    const response = await fetch("/api/exportItems");
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "exported_items.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      console.error("Failed to export items");
    }
  };

  return (
    <div className="flex flex-col gap-y-8 min-h-64">
      <div className="flex">
        <button
          onClick={() => {
            setIsImport(true);
            setIsClear(false);
          }}
          className={isImport ? "tab-active" : "tab"}
        >
          Import
        </button>
        <button
          onClick={() => {
            setIsImport(false);
            setIsClear(false);
          }}
          className={!isImport && !isClear ? "tab-active" : "tab"}
        >
          Export
        </button>
        <button
          onClick={() => {
            setIsClear(true);
            setIsImport(false);
          }}
          className={isClear ? "tab-active" : "tab"}
        >
          Slett alt
        </button>
      </div>
      {isImport ? (
        <form onSubmit={handleImport}>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={importing}
            className="button-secondary w-full max-w-full"
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
                Successfully imported: {results.filter((r) => r.success).length}{" "}
                / {results.length} items
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
          <button type="submit" className="button-primary-accent text-lg mt-8">
            Importer utstyr
          </button>
        </form>
      ) : isClear ? (
        <div>
          <h3>Er du sikker på at du vil slette alt ustyret fra listen?</h3>
          <button
            onClick={handleClearItems}
            className="button-primary-accent text-lg mt-8"
          >
            Ja, slett alt
          </button>
          {results.length > 0 && (
            <div className="mt-4">
              <h3>Clear Results:</h3>
              <ul className="mt-2">
                {results.map((result, index) => (
                  <li
                    key={index}
                    className={`${result.success ? "text-green-500" : "text-red-500"} py-1`}
                  >
                    {result.name}: {result.success ? "Success" : result.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            className="button-primary-accent text-lg"
            onClick={handleExport}
          >
            Eksporter utstyr til .xlsx
          </button>
        </div>
      )}
    </div>
  );
}
