import { useState, useEffect, useCallback, useRef } from 'react';

// Types for upload draft persistence
export interface DraftTrack {
  id: string;
  name: string;
  title: string;
  duration: number;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadDraft {
  releaseType: 'single' | 'ep' | 'album';
  tracks: DraftTrack[];
  releaseTitle: string;
  artistName: string;
  genre: string;
  description: string;
  scheduledReleaseDate: string | null;
  metadata: Record<string, any> | null;
  metadataComplete: boolean;
  savedAt: number;
  uploadProgress: number;
  wasUploading: boolean;
}

const DRAFT_STORAGE_KEY = 'music_upload_draft';
const DRAFT_FILES_KEY = 'music_upload_draft_files';
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Store file references in IndexedDB for persistence across tab switches
const openDraftDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('UploadDraftsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };
  });
};

const saveFilesToDB = async (files: Map<string, File>): Promise<void> => {
  try {
    const db = await openDraftDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    
    // Clear existing files
    store.clear();
    
    // Save new files
    for (const [id, file] of files.entries()) {
      // Store file as ArrayBuffer for persistence
      const arrayBuffer = await file.arrayBuffer();
      store.put({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: arrayBuffer
      });
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    db.close();
  } catch (error) {
    console.warn('Failed to save files to IndexedDB:', error);
  }
};

const loadFilesFromDB = async (): Promise<Map<string, File>> => {
  const files = new Map<string, File>();
  
  try {
    const db = await openDraftDB();
    const transaction = db.transaction(['files'], 'readonly');
    const store = transaction.objectStore('files');
    
    const allFiles = await new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    for (const fileData of allFiles) {
      const blob = new Blob([fileData.data], { type: fileData.type });
      const file = new File([blob], fileData.name, {
        type: fileData.type,
        lastModified: fileData.lastModified
      });
      files.set(fileData.id, file);
    }
    
    db.close();
  } catch (error) {
    console.warn('Failed to load files from IndexedDB:', error);
  }
  
  return files;
};

const clearFilesFromDB = async (): Promise<void> => {
  try {
    const db = await openDraftDB();
    const transaction = db.transaction(['files'], 'readwrite');
    const store = transaction.objectStore('files');
    store.clear();
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    
    db.close();
  } catch (error) {
    console.warn('Failed to clear files from IndexedDB:', error);
  }
};

export interface UseUploadDraftReturn {
  hasDraft: boolean;
  draft: UploadDraft | null;
  draftFiles: Map<string, File>;
  saveDraft: (draft: Omit<UploadDraft, 'savedAt'>, files: Map<string, File>) => Promise<void>;
  loadDraft: () => Promise<{ draft: UploadDraft; files: Map<string, File> } | null>;
  clearDraft: () => Promise<void>;
  draftAge: string | null;
  isDraftRecoverable: boolean;
}

export function useUploadDraft(): UseUploadDraftReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [draftFiles, setDraftFiles] = useState<Map<string, File>>(new Map());
  const [draftAge, setDraftAge] = useState<string | null>(null);
  const initChecked = useRef(false);

  // Check for existing draft on mount
  useEffect(() => {
    if (initChecked.current) return;
    initChecked.current = true;

    const checkForDraft = async () => {
      try {
        const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!storedDraft) {
          setHasDraft(false);
          return;
        }

        const parsedDraft: UploadDraft = JSON.parse(storedDraft);
        
        // Check if draft is too old
        if (Date.now() - parsedDraft.savedAt > DRAFT_MAX_AGE_MS) {
          await clearDraft();
          return;
        }

        // Check if files still exist in IndexedDB
        const files = await loadFilesFromDB();
        
        if (files.size === 0 || files.size !== parsedDraft.tracks.length) {
          // Files missing, clear draft
          await clearDraft();
          return;
        }

        setDraft(parsedDraft);
        setDraftFiles(files);
        setHasDraft(true);
        
        // Calculate age string
        const ageMs = Date.now() - parsedDraft.savedAt;
        const ageMinutes = Math.floor(ageMs / 60000);
        if (ageMinutes < 1) {
          setDraftAge('just now');
        } else if (ageMinutes < 60) {
          setDraftAge(`${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`);
        } else {
          const ageHours = Math.floor(ageMinutes / 60);
          setDraftAge(`${ageHours} hour${ageHours === 1 ? '' : 's'} ago`);
        }
      } catch (error) {
        console.warn('Failed to check for draft:', error);
        setHasDraft(false);
      }
    };

    checkForDraft();
  }, []);

  const saveDraft = useCallback(async (
    draftData: Omit<UploadDraft, 'savedAt'>,
    files: Map<string, File>
  ): Promise<void> => {
    try {
      const fullDraft: UploadDraft = {
        ...draftData,
        savedAt: Date.now()
      };

      // Save metadata to localStorage
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fullDraft));
      
      // Save files to IndexedDB
      await saveFilesToDB(files);

      setDraft(fullDraft);
      setDraftFiles(files);
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  const loadDraft = useCallback(async (): Promise<{ draft: UploadDraft; files: Map<string, File> } | null> => {
    try {
      const storedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!storedDraft) return null;

      const parsedDraft: UploadDraft = JSON.parse(storedDraft);
      const files = await loadFilesFromDB();

      if (files.size === 0) return null;

      return { draft: parsedDraft, files };
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, []);

  const clearDraft = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      await clearFilesFromDB();
      setDraft(null);
      setDraftFiles(new Map());
      setHasDraft(false);
      setDraftAge(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  const isDraftRecoverable = hasDraft && draft !== null && draftFiles.size > 0;

  return {
    hasDraft,
    draft,
    draftFiles,
    saveDraft,
    loadDraft,
    clearDraft,
    draftAge,
    isDraftRecoverable
  };
}

// Hook to auto-save draft on visibility change and before unload
export function useAutoSaveDraft(
  getDraftData: () => { draft: Omit<UploadDraft, 'savedAt'>; files: Map<string, File> } | null,
  isUploading: boolean
) {
  const { saveDraft, clearDraft } = useUploadDraft();
  const lastSaveRef = useRef<number>(0);
  const saveIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    const now = Date.now();
    if (now - lastSaveRef.current < 2000) return; // Don't save more than once every 2 seconds
    
    const data = getDraftData();
    if (data && data.draft.tracks.length > 0) {
      lastSaveRef.current = now;
      await saveDraft(data.draft, data.files);
    }
  }, [getDraftData, saveDraft]);

  useEffect(() => {
    // Save on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        debouncedSave();
      }
    };

    // Save before page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const data = getDraftData();
      if (data && data.draft.tracks.length > 0 && !isUploading) {
        // Synchronously save to localStorage (IndexedDB save may not complete)
        const draftData: UploadDraft = {
          ...data.draft,
          savedAt: Date.now()
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        
        // Show confirmation if uploading
        if (isUploading) {
          e.preventDefault();
          e.returnValue = 'Upload in progress. Are you sure you want to leave?';
          return e.returnValue;
        }
      }
    };

    // Save periodically while tracks are present
    saveIntervalRef.current = setInterval(() => {
      const data = getDraftData();
      if (data && data.draft.tracks.length > 0) {
        debouncedSave();
      }
    }, 30000); // Save every 30 seconds

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [getDraftData, isUploading, debouncedSave]);

  return { clearDraft };
}
