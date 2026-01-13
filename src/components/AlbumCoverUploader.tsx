import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumCoverUploaderProps {
  /** Current cover art path (if exists) */
  coverPath?: string | null;
  /** Storage bucket for cover art */
  bucket?: string;
  /** Callback when cover is uploaded - returns the storage path */
  onUpload: (path: string, publicUrl: string) => void;
  /** Whether cover is required before submission */
  required?: boolean;
  /** Size of the uploader */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
  /** Label for the upload area */
  label?: string;
  /** Show validation status */
  showValidation?: boolean;
  /** Disable the uploader */
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const AlbumCoverUploader = ({
  coverPath,
  bucket = "album-covers",
  onUpload,
  required = false,
  size = "md",
  className,
  label = "Album Cover",
  showValidation = true,
  disabled = false,
}: AlbumCoverUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current cover URL
  const currentCoverUrl = coverPath
    ? supabase.storage.from(bucket).getPublicUrl(coverPath).data.publicUrl
    : previewUrl;

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) || 
                        ACCEPTED_EXTENSIONS.includes(extension);
    
    if (!isValidType) {
      return "Please upload JPG, PNG, or WebP images";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 10MB";
    }

    return null;
  };

  const validateAspectRatio = (file: File): Promise<{ valid: boolean; message?: string }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = img.width / img.height;
        
        // Allow aspect ratios between 0.9 and 1.1 (roughly square)
        if (ratio < 0.9 || ratio > 1.1) {
          resolve({ 
            valid: false, 
            message: "Image should be square (1:1 ratio). Current ratio: " + ratio.toFixed(2)
          });
        } else {
          resolve({ valid: true });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ valid: true }); // Allow if we can't check
      };
      
      img.src = objectUrl;
    });
  };

  const handleUpload = useCallback(async (file: File) => {
    setValidationError(null);
    
    // Validate file
    const fileError = validateFile(file);
    if (fileError) {
      setValidationError(fileError);
      toast.error(fileError);
      return;
    }

    // Check aspect ratio (warning only, don't block)
    const aspectResult = await validateAspectRatio(file);
    if (!aspectResult.valid) {
      toast.warning("Square images (1:1) look best for album covers", {
        description: aspectResult.message,
      });
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Please sign in to upload");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      
      // Callback with path and URL
      onUpload(fileName, urlData.publicUrl);
      
      toast.success("Cover uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      setValidationError(error.message || "Upload failed");
      toast.error("Failed to upload cover", {
        description: error.message,
      });
      // Clear preview on error
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [bucket, onUpload]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [disabled, uploading, handleUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasCover = !!(currentCoverUrl || coverPath);
  const isValid = !required || hasCover;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {showValidation && hasCover && (
          <span className="text-xs text-primary flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Uploaded
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative rounded-lg overflow-hidden transition-all duration-200",
          sizeClasses[size],
          "border-2 border-dashed",
          dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30",
          !isValid && showValidation ? "border-destructive/50" : "",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        {/* Current/Preview Image */}
        {currentCoverUrl ? (
          <img
            src={currentCoverUrl}
            alt="Album cover preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/30 p-2">
            <ImageIcon className={cn(
              "text-muted-foreground/50 mb-1",
              size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-12 h-12"
            )} />
            <span className={cn(
              "text-muted-foreground text-center",
              size === "sm" ? "text-[10px]" : "text-xs"
            )}>
              {dragActive ? "Drop here" : "Drop or click"}
            </span>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Hover overlay for existing images */}
        {currentCoverUrl && !uploading && !disabled && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-6 h-6 mx-auto text-white mb-1" />
              <span className="text-xs text-white">Replace</span>
            </div>
          </div>
        )}
      </div>

      {/* Validation Error */}
      {validationError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validationError}
        </p>
      )}

      {/* Requirements hint */}
      {!hasCover && !validationError && (
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP • Square (1:1) • Max 10MB
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
};
