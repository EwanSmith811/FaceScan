import type { TraitMap } from "@/lib/merge-results";

const CACHE_STORAGE_KEY = "facescan_analysis_cache_v1";
const MAX_CACHE_ENTRIES = 12;

type CachedAnalysisEntry = {
  key: string;
  traits: TraitMap;
  cachedAt: number;
};

type CachedAnalysisStore = {
  entries: CachedAnalysisEntry[];
};

function loadStore(): CachedAnalysisStore {
  if (typeof window === "undefined") {
    return { entries: [] };
  }

  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);

    if (!raw) {
      return { entries: [] };
    }

    const parsed = JSON.parse(raw) as CachedAnalysisStore;
    return Array.isArray(parsed.entries) ? parsed : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

function saveStore(store: CachedAnalysisStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    return;
  }
}

export async function createAnalysisCacheKey(
  frontBase64: string,
  sideBase64: string,
): Promise<string> {
  const payload = `${frontBase64}::${sideBase64}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function loadCachedAnalysis(key: string): TraitMap | null {
  const store = loadStore();
  const match = store.entries.find((entry) => entry.key === key);

  if (!match) {
    return null;
  }

  return match.traits;
}

export function saveCachedAnalysis(key: string, traits: TraitMap): void {
  const store = loadStore();
  const nextEntries = [
    {
      key,
      traits,
      cachedAt: Date.now(),
    },
    ...store.entries.filter((entry) => entry.key !== key),
  ].slice(0, MAX_CACHE_ENTRIES);

  saveStore({ entries: nextEntries });
}
