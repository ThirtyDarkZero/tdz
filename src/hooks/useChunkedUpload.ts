import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UploadProgress {
  phase: 'idle' | 'initializing' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  bytesUploaded: number;
  totalBytes: number;
}

interface ChunkedUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

interface UseChunkedUploadOptions {
  chunkSizeMB?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
}

const DEFAULT_CHUNK_SIZE_MB = 5;
const DEFAULT_MAX_RETRIES = 3;

export function useChunkedUpload(options: UseChunkedUploadOptions = {}) {
  const {
    chunkSizeMB = DEFAULT_CHUNK_SIZE_MB,
    maxRetries = DEFAULT_MAX_RETRIES,
    onProgress
  } = options;

  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    phase: 'idle',
    progress: 0,
    message: '',
    bytesUploaded: 0,
    totalBytes: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isUploadingRef = useRef(false);

  const updateProgress = useCallback((update: Partial<UploadProgress>) => {
    setUploadProgress(prev => {
      const newProgress = { ...prev, ...update };
      onProgress?.(newProgress);
      return newProgress;
    });
  }, [onProgress]);

  const uploadChunkWithRetry = async (
    chunk: Blob,
    chunkIndex: number,
    sessionId: string,
    authToken: string
  ): Promise<boolean> => {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('chunk', chunk);

        const response = await supabase.functions.invoke('upload-chunk', {
          body: formData
        });

        if (response.error) {
          throw new Error(response.error.message || 'Chunk upload failed');
        }

        return true;
      } catch (error) {
        retries++;
        console.warn(`Chunk ${chunkIndex} upload failed (attempt ${retries}):`, error);
        
        if (retries >= maxRetries) {
          return false;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    return false;
  };

  const uploadFile = useCallback(async (
    file: File,
    bucket: string = 'track-files',
    projectId?: string
  ): Promise<ChunkedUploadResult> => {
    if (isUploadingRef.current) {
      return { success: false, error: 'Upload already in progress' };
    }

    isUploadingRef.current = true;
    abortControllerRef.current = new AbortController();

    const chunkSize = chunkSizeMB * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const isLargeFile = file.size > chunkSize;

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const user = session.user;

      updateProgress({
        phase: 'initializing',
        progress: 5,
        message: 'Preparing upload...',
        bytesUploaded: 0,
        totalBytes: file.size
      });

      // For small files, use direct upload
      if (!isLargeFile) {
        updateProgress({
          phase: 'uploading',
          progress: 20,
          message: 'Uploading file...',
          bytesUploaded: 0,
          totalBytes: file.size
        });

        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 100);
        const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const filePath = `${user.id}/${uniqueId}-${sanitizedFileName}`;

        let uploadSuccess = false;
        let retries = 0;

        while (retries < maxRetries && !uploadSuccess) {
          const { error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (!error) {
            uploadSuccess = true;
          } else {
            retries++;
            if (retries >= maxRetries) {
              throw new Error(`Upload failed: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }

        updateProgress({
          phase: 'complete',
          progress: 100,
          message: 'Upload complete!',
          bytesUploaded: file.size,
          totalBytes: file.size
        });

        isUploadingRef.current = false;
        return { success: true, filePath };
      }

      // For large files, use chunked upload
      updateProgress({
        phase: 'initializing',
        progress: 10,
        message: 'Creating upload session...',
        bytesUploaded: 0,
        totalBytes: file.size
      });

      // Create upload session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-upload-session', {
        body: {
          fileName: file.name,
          fileSizeBytes: file.size,
          projectId,
          chunkSizeBytes: chunkSize
        }
      });

      if (sessionError || !sessionData?.sessionId) {
        throw new Error(sessionError?.message || 'Failed to create upload session');
      }

      const { sessionId } = sessionData;

      // Upload chunks
      let bytesUploaded = 0;
      const failedChunks: number[] = [];

      for (let i = 0; i < totalChunks; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const success = await uploadChunkWithRetry(
          chunk,
          i,
          sessionId,
          session.access_token
        );

        if (!success) {
          failedChunks.push(i);
        } else {
          bytesUploaded += chunk.size;
          
          const progress = 10 + ((bytesUploaded / file.size) * 80);
          updateProgress({
            phase: 'uploading',
            progress,
            message: `Uploading chunk ${i + 1} of ${totalChunks}...`,
            bytesUploaded,
            totalBytes: file.size
          });
        }
      }

      if (failedChunks.length > 0) {
        throw new Error(`Failed to upload chunks: ${failedChunks.join(', ')}`);
      }

      updateProgress({
        phase: 'processing',
        progress: 95,
        message: 'Processing file...',
        bytesUploaded: file.size,
        totalBytes: file.size
      });

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 60;
      let finalPath: string | undefined;

      while (attempts < maxAttempts) {
        const { data: sessionStatus } = await supabase
          .from('upload_sessions')
          .select('status, storage_path, error_message')
          .eq('id', sessionId)
          .single();

        if (sessionStatus?.status === 'completed') {
          finalPath = sessionStatus.storage_path;
          break;
        }

        if (sessionStatus?.status === 'failed') {
          throw new Error(sessionStatus.error_message || 'File processing failed');
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (!finalPath) {
        throw new Error('File processing timed out');
      }

      updateProgress({
        phase: 'complete',
        progress: 100,
        message: 'Upload complete!',
        bytesUploaded: file.size,
        totalBytes: file.size
      });

      isUploadingRef.current = false;
      return { success: true, filePath: finalPath };

    } catch (error: any) {
      console.error('Upload error:', error);
      
      updateProgress({
        phase: 'error',
        progress: 0,
        message: error.message || 'Upload failed',
        bytesUploaded: 0,
        totalBytes: file.size
      });

      isUploadingRef.current = false;
      return { success: false, error: error.message || 'Upload failed' };
    }
  }, [chunkSizeMB, maxRetries, updateProgress]);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isUploadingRef.current = false;
    updateProgress({
      phase: 'idle',
      progress: 0,
      message: '',
      bytesUploaded: 0,
      totalBytes: 0
    });
  }, [updateProgress]);

  const resetProgress = useCallback(() => {
    updateProgress({
      phase: 'idle',
      progress: 0,
      message: '',
      bytesUploaded: 0,
      totalBytes: 0
    });
  }, [updateProgress]);

  return {
    uploadFile,
    cancelUpload,
    resetProgress,
    uploadProgress,
    isUploading: isUploadingRef.current
  };
}
