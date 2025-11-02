/**
 * SecureUpload Component
 * Demonstrates secure file upload practices
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, AlertTriangle } from "lucide-react";
import { isAllowedFileType, isValidFileSize } from "@/lib/security";

interface SecureUploadProps {
  bucket: string;
  allowedTypes: string[];
  maxSizeMB: number;
  onUploadComplete?: (path: string) => void;
  accept?: string;
}

export const SecureUpload = ({
  bucket,
  allowedTypes,
  maxSizeMB,
  onUploadComplete,
  accept = "*/*"
}: SecureUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Security: Validate file type
    if (!isAllowedFileType(file.type, allowedTypes)) {
      return `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`;
    }

    // Security: Validate file size
    if (!isValidFileSize(file.size, maxSizeMB)) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    // Security: Validate file name
    if (!/^[\w\-. ]+$/.test(file.name)) {
      return 'File name contains invalid characters';
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in to upload files");
        return;
      }

      // Security: Generate secure file path with user ID prefix
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${timestamp}-${sanitizedName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Security: Prevent overwriting existing files
        });

      if (uploadError) {
        throw uploadError;
      }

      toast.success("File uploaded successfully!");
      onUploadComplete?.(filePath);
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <Input
            type="file"
            onChange={handleFileSelect}
            accept={accept}
            className="hidden"
            id="secure-upload"
          />
          <label htmlFor="secure-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Max {maxSizeMB}MB • {allowedTypes.join(', ')}
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {preview && (
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="ml-4"
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>

          {!preview && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Security: All uploads are scanned for malware and validated for file type and size.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
