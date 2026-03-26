import { useState, useEffect, useCallback } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const storageKey = `tdz_draft_${key}`;

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (state === null || state === undefined || JSON.stringify(state) === JSON.stringify(defaultValue)) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch (err) {
      console.warn("Failed to persist state:", err);
    }
  }, [storageKey, state]);

  const clearPersistedState = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState(defaultValue);
  }, [storageKey, defaultValue]);

  return [state, setState, clearPersistedState];
}
