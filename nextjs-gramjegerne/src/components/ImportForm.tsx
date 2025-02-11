import {useSession} from 'next-auth/react';
import React, {useState} from 'react';
import * as XLSX from 'xlsx';

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

export function ImportForm({onSuccess}: {onSuccess: () => void}) {
  const {data: session, status} = useSession();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [isImport, setIsImport] = useState(true);
  const [isClear, setIsClear] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === 'loading') {
      return;
    }

    if (!session?.user) {
      setResults([
        {
          success: false,
          name: 'Auth Error',
          error: 'Please log in to import items',
        },
      ]);
      return;
    }

    if (!file) {
      setResults([{success: false, name: 'File Error', error: 'No file selected'}]);
      return;
    }

    setImporting(true);
    setResults([]);
    setProgress(0);
    setProgressMessage('Processing file...');

    try {
      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      // Process categories first
      setProgressMessage('Checking categories...');
      const uniqueCategories = new Set(
        jsonData.map((item) => item.category).filter((category): category is string => !!category),
      );

      const categoryResponse = await fetch('/api/validateCategories', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          categories: Array.from(uniqueCategories),
        }),
      });

      if (!categoryResponse.ok) {
        throw new Error('Failed to validate/create categories');
      }

      const {categoryMap} = await categoryResponse.json();
      setProgressMessage('Processing items...');

      // Process each item
      const itemsToProcess = jsonData.map((item) => ({
        name: item.name,
        size: item.size,
        weight: item.weight ? Number(item.weight) : undefined,
        weight_unit: item.unit || 'g',
        calories: item.calories ? Number(item.calories) : undefined,
        categoryId: item.category ? categoryMap[item.category] : null,
        imageAssetId: null,
        image_url: item.image_url,
      }));

      // Process items
      let processedResults: ImportResult[] = [];
      const CHUNK_SIZE = 5;

      for (let i = 0; i < itemsToProcess.length; i += CHUNK_SIZE) {
        const chunk = itemsToProcess.slice(i, i + CHUNK_SIZE);

        const chunkPromises = chunk.map(async (itemData) => {
          try {
            let imageAssetId = null;
            if (itemData.image_url) {
              setProgressMessage(`Uploading image for ${itemData.name}...`);
              imageAssetId = await uploadImageToSanity(itemData.image_url);
            }

            const response = await fetch('/api/importItems', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify([
                {
                  name: itemData.name,
                  size: itemData.size,
                  weight: itemData.weight,
                  weight_unit: itemData.weight_unit,
                  calories: itemData.calories,
                  categoryId: itemData.categoryId,
                  imageAssetId,
                },
              ]),
            });

            if (!response.ok) {
              throw new Error(`Import failed for ${itemData.name}`);
            }

            const {results} = await response.json();
            return results[0];
          } catch (error) {
            return {
              success: false,
              name: itemData.name,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        processedResults = [...processedResults, ...chunkResults];

        setProgress(Math.round(((i + chunk.length) / itemsToProcess.length) * 100));
      }

      setResults(processedResults);
      if (processedResults.every((r) => r.success)) {
        setProgressMessage('Import completed successfully!');
        onSuccess();
      } else {
        setProgressMessage('Import completed with some errors');
      }
    } catch (error) {
      console.error('Import error:', error);
      setResults([
        {
          success: false,
          name: 'Import',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      ]);
    } finally {
      setImporting(false);
    }
  }

  async function handleClearItems() {
    const response = await fetch('/api/clearItems', {
      method: 'DELETE',
    });

    if (response.ok) {
      setResults([{success: true, name: 'All items cleared.'}]);
      onSuccess();
    } else {
      const error = await response.json();
      setResults([{success: false, name: 'Clear failed', error: error.message}]);
    }
  }

  async function uploadImageToSanity(imageUrl: string) {
    if (!imageUrl) return null;
    const maxRetries = 5;
    let attempt = 0;

    try {
      const categoryResponse = await fetch('/api/getCategories');
      if (!categoryResponse.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categories = await categoryResponse.json();
      if (!categories?.length) {
        throw new Error('No categories available');
      }

      while (attempt < maxRetries) {
        try {
          console.log(`Attempting to fetch image from URL: ${imageUrl}`);
          const response = await fetch(imageUrl);

          if (!response.ok) {
            console.error(`Failed to fetch image. Status: ${response.status}`);
            throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
          }

          const blob = await response.blob();
          console.log('Successfully created blob from image');

          const formData = new FormData();
          formData.append('image', blob);

          const uploadResponse = await fetch('/api/uploadAsset', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          const result = await uploadResponse.json();
          return result.assetId;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Attempt ${attempt + 1} failed:`, errorMessage);

          if (attempt === maxRetries - 1) {
            return null;
          }
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    } catch (error: unknown) {
      console.error('Failed to upload image:', error);
      return null;
    }

    return null;
  }

  async function handleExport() {
    const response = await fetch('/api/exportItems');
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_items.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      console.error('Failed to export items');
    }
  }

  return (
    <div className="flex flex-col gap-y-8 min-h-64">
      <div className="flex">
        <button
          onClick={() => {
            setIsImport(true);
            setIsClear(false);
          }}
          className={isImport ? 'tab-active' : 'tab'}
        >
          Import
        </button>
        <button
          onClick={() => {
            setIsImport(false);
            setIsClear(false);
          }}
          className={!isImport && !isClear ? 'tab-active' : 'tab'}
        >
          Export
        </button>
        <button
          onClick={() => {
            setIsClear(true);
            setIsImport(false);
          }}
          className={isClear ? 'tab-active' : 'tab'}
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
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <p>{progressMessage}</p>
                <p>Importing... {progress}%</p>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2.5">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all duration-300"
                  style={{width: `${progress}%`}}
                ></div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="pt-4">
              <h3>Import Results:</h3>
              <div className="text-sm text-white mb-2">
                Successfully imported: {results.filter((r) => r.success).length} / {results.length}{' '}
                items
              </div>
              <ul className="mt-2 max-h-60 overflow-y-auto pt-4">
                {results.map((result, index) => (
                  <li
                    key={index}
                    className={`${result.success ? 'text-green-500' : 'text-red-500'} py-1`}
                  >
                    {result.name}: {result.success ? 'Success' : result.error}
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
          <button onClick={handleClearItems} className="button-primary-accent text-lg mt-8">
            Ja, slett alt
          </button>
          {results.length > 0 && (
            <div className="mt-4">
              <h3>Clear Results:</h3>
              <ul className="mt-2">
                {results.map((result, index) => (
                  <li
                    key={index}
                    className={`${result.success ? 'text-green-500' : 'text-red-500'} py-1`}
                  >
                    {result.name}: {result.success ? 'Success' : result.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button className="button-primary-accent text-lg" onClick={handleExport}>
            Eksporter utstyr til .xlsx
          </button>
        </div>
      )}
    </div>
  );
}
