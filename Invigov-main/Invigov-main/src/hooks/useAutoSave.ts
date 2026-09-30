/**
 * useAutoSave Hook
 *
 * Milestone 2 Requirement: Auto-save form data with 500ms debounce
 * Automatically saves form data to the backend when user stops typing for 500ms
 */

import { useEffect, useRef, useState } from "react";
import { UseFormWatch, FieldValues } from "react-hook-form";

interface UseAutoSaveOptions<T extends FieldValues> {
  watch: UseFormWatch<T>;
  onSave: (data: T) => Promise<void> | void;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
}

export function useAutoSave<T extends FieldValues>({
  watch,
  onSave,
  debounceMs = 500,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    const subscription = watch((data) => {
      const currentData = JSON.stringify(data);

      // Skip if data hasn't changed
      if (currentData === previousDataRef.current) {
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(async () => {
        setState((prev) => ({ ...prev, isSaving: true, error: null }));

        try {
          await onSave(data as T);
          previousDataRef.current = currentData;
          setState({
            isSaving: false,
            lastSaved: new Date(),
            error: null,
          });
        } catch (error) {
          setState({
            isSaving: false,
            lastSaved: null,
            error: error as Error,
          });
        }
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [watch, onSave, debounceMs, enabled]);

  return state;
}
