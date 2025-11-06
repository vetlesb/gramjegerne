import {useEffect, useState} from 'react';

/**
 * Custom hook to delay showing a loader to prevent "flash of loading state"
 * Only shows the loader if loading takes longer than the specified delay
 * 
 * @param isLoading - The actual loading state
 * @param delay - Delay in ms before showing loader (default: 300ms)
 * @returns boolean - Whether to show the loader
 */
export function useDelayedLoader(isLoading: boolean, delay = 300): boolean {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Only show loader after delay
      const timeout = setTimeout(() => {
        setShowLoader(true);
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      // Hide loader immediately when loading finishes
      setShowLoader(false);
    }
  }, [isLoading, delay]);

  return showLoader;
}

