"use client";

const DB_NAME = "facescan_uploads";
const STORE_NAME = "uploads";
const DB_VERSION = 1;

export type UploadCacheKey = "front" | "side";
type CachedUploadRecord = {
  blob: Blob;
  lastModified: number;
  name: string;
  type: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Upload cache is unavailable."));
  });
}

export async function loadCachedUpload(
  key: UploadCacheKey,
): Promise<File | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  const database = await openDatabase();

  try {
    return await new Promise<File | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;

        if (result instanceof File) {
          resolve(
            new File([result], result.name || `${key}.jpg`, {
              lastModified: result.lastModified,
              type: result.type,
            }),
          );
          return;
        }

        if (
          result &&
          typeof result === "object" &&
          "blob" in result &&
          result.blob instanceof Blob &&
          "name" in result &&
          typeof result.name === "string"
        ) {
          const cached = result as CachedUploadRecord;
          resolve(
            new File([cached.blob], cached.name, {
              lastModified: cached.lastModified,
              type: cached.type || cached.blob.type,
            }),
          );
          return;
        }

        resolve(null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Could not load cached upload."));
    });
  } finally {
    database.close();
  }
}

export async function saveCachedUpload(
  key: UploadCacheKey,
  file: File,
): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const cachedRecord: CachedUploadRecord = {
        blob: file,
        lastModified: file.lastModified,
        name: file.name,
        type: file.type,
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not cache upload."));

      store.put(cachedRecord, key);
    });
  } finally {
    database.close();
  }
}

export async function clearCachedUpload(key: UploadCacheKey): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Could not clear cached upload."));

      store.delete(key);
    });
  } finally {
    database.close();
  }
}

export async function clearCachedUploads(): Promise<void> {
  await Promise.all([
    clearCachedUpload("front"),
    clearCachedUpload("side"),
  ]);
}
