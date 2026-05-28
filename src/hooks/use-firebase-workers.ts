import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import type { Worker } from "@/data/workers";
import { searchWorkers, skillSlugToCategory } from "@/lib/workers.functions";

type WorkerFetchState = {
  workers: Worker[];
  loading: boolean;
  error: string | null;
};

export function useFirebaseWorkers(category: string | undefined, area: string | null | undefined) {
  const search = useServerFn(searchWorkers);
  const [state, setState] = useState<WorkerFetchState>({
    workers: [],
    loading: false,
    error: null,
  });

  const fetchWorkers = useCallback(async () => {
    if (!category) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("No internet connection. Please try again.");
      }
      const skillCategory = category.includes("/")
        ? category
        : skillSlugToCategory(category);
      const matched = await search({
        data: {
          category: skillCategory,
          area: area?.trim() ?? "",
        },
      });
      console.log("[useFirebaseWorkers] matched:", matched);
      if (matched.length === 0) {
        setState({
          workers: [],
          loading: false,
          error: "No workers found in this area yet.\nTry selecting a nearby area.",
        });
      } else {
        setState({ workers: matched, loading: false, error: null });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load workers right now.";
      setState({ workers: [], loading: false, error: message });
    }
  }, [search, category, area]);

  useEffect(() => {
    if (category) fetchWorkers();
  }, [category, area, fetchWorkers]);

  return { ...state, refetch: fetchWorkers };
}
