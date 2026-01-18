/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  File,
  Video,
  Image,
} from "lucide-react";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
} from "../../utils/constants";

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  status?: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUpload,
  multiple = true,
  maxSize = MAX_FILE_SIZE,
  disabled = false,
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.flatMap(({ errors }) => errors);
        const errorMessages = errors.map((error) => {
          if (error.code === "file-too-large") {
            return `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB`;
          }
          if (error.code === "file-invalid-type") {
            return "File type not allowed";
          }
          return error.message;
        });
        setError(errorMessages.join(", "));
        return;
      }

      // Check total files limit
      if (
        multiple &&
        files.length + acceptedFiles.length > MAX_FILES_PER_UPLOAD
      ) {
        setError(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`);
        return;
      }

      // Add previews and set status
      const filesWithPreviews = acceptedFiles.map((file) => {
        const fileWithPreview: FileWithPreview = Object.assign(file, {
          preview: file?.type?.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined,
          status: "pending" as const,
          uploadProgress: 0,
        });
        return fileWithPreview;
      });

      if (multiple) {
        setFiles((prev) => [...prev, ...filesWithPreviews]);
      } else {
        setFiles(filesWithPreviews);
      }
    },
    [files.length, maxSize, multiple]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxSize,
    disabled: disabled || isUploading,
    accept: {
      ...Object.values(ALLOWED_FILE_TYPES).reduce((acc, types) => {
        types.forEach((type) => {
          acc[type] = [];
        });
        return acc;
      }, {} as Record<string, string[]>),
    },
  });

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: "uploading" as const,
          uploadProgress: 0,
        }))
      );

      // Simulate upload progress (replace with actual upload logic)
      const uploadPromises = files.map(async (file, index) => {
        try {
          // Simulate progress updates
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            setFiles((prev) =>
              prev.map((f, i) =>
                i === index ? { ...f, uploadProgress: progress } : f
              )
            );
          }

          // Mark as completed
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: "completed" as const, uploadProgress: 100 }
                : f
            )
          );
        } catch (error) {
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? {
                    ...f,
                    status: "error" as const,
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          );
          throw error;
        }
      });

      await Promise.all(uploadPromises);

      // Call the parent's upload handler with actual files
      await onUpload(files);

      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];

      // Revoke preview URL to avoid memory leaks
      if (removedFile.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const clearAllFiles = () => {
    // Revoke all preview URLs
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setError(null);
  };

  const getFileIcon = (file: Pick<File, "type" | "name">) => {
    const type = typeof file.type === "string" ? file.type : "";

    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Video;

    // fallback by extension (critical)
    const ext = file?.name?.split(".").pop()?.toLowerCase();

    if (ext && ["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
      return Image;
    if (ext && ["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return Video;

    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Cleanup preview URLs on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {isDragActive
                ? "Drop the files here..."
                : "Drag & drop files here, or click to select"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {multiple ? "Multiple files allowed" : "Single file only"} • Max
              size: {maxSize / (1024 * 1024)}MB • Supported: Images, Videos,
              Documents
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={clearAllFiles}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file);
              const isUploadingFile = file.status === "uploading";
              const isCompleted = file.status === "completed";
              const isError = file.status === "error";

              return (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* File Icon/Preview */}
                    {file.preview ? (
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isError
                                ? "bg-red-500"
                                : isCompleted
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${file.uploadProgress || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {file.status === "uploading" && "Uploading..."}
                            {file.status === "completed" && "Completed"}
                            {file.status === "error" && "Failed"}
                            {file.status === "pending" && "Ready to upload"}
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {file.uploadProgress || 0}%
                          </span>
                        </div>
                      </div>

                      {/* Error Message */}
                      {isError && file.error && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {file.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 ml-4">
                    {isUploadingFile ? (
                      <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    ) : isCompleted ? (
                      <Check className="h-6 w-6 text-green-500" />
                    ) : isError ? (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                        disabled={isUploading}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${
                  isUploading || files.length === 0
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                }
              `}
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Uploading...
                </div>
              ) : (
                `Upload ${files.length} file${files.length !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
