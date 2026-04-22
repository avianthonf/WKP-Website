'use client';

import { scan } from 'react-scan';
import { useEffect } from 'react';

/**
 * Development-only component to initialize react-scan.
 * Helps identify performance bottlenecks and re-render loops.
 */
export function ReactScan() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      scan({
        enabled: true,
        log: true, // log renders to the console
      });
    }
  }, []);

  return null;
}
