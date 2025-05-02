
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return undefined;
    
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    
    // Set on mount
    setMatches(media.matches);
    
    // Listen for changes
    media.addEventListener('change', listener);
    
    // Clean up
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
