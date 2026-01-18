/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Upload as UploadIcon, File, Video, Image, X, AlertCircle, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import DragDropUpload from '../upload/DragDropUpload';
import { useUIStore } from '../../stores/ui.store';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

export const Upload: React.FC = () => {
  const queryClient = useQueryClient();
  const { addUpload, updateUploadProgress, updateUploadStatus } = useUIStore();
  const [uploadQueue, setUploadQueue] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPath, setUploadPath] = useState<string>('');

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const newUploads: UploadedFile[] = [];

    // Add files to upload queue
    for (const file of files) {
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadedFile: UploadedFile = {
        id: uploadId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
      };
      newUploads.push(uploadedFile);
    }

    setUploadQueue(prev => [...prev, ...newUploads]);

    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = newUploads[i].id;

      try {
        // Update status to uploading
        updateUploadStatus(uploadId, 'uploading');
        setUploadQueue(prev =>
          prev.map(upload =>
            upload.id === uploadId ? { ...upload, status: 'uploading' } : upload
          )
        );

        // Prepare metadata if needed (e.g., for videos)
        const metadata = file.type.startsWith('video/')
          ? { duration: 0, thumbnailPath: '' }
          : undefined;

        // Upload file with progress tracking
        await apiClient.uploadFile(
          '/files/upload',
          file,
          (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              updateUploadProgress(uploadId, progress);
              setUploadQueue(prev =>
                prev.map(upload =>
                  upload.id === uploadId ? { ...upload, progress } : upload
                )
              );
            }
          },
          metadata
        );

        // Update status to completed
        updateUploadStatus(uploadId, 'completed');
        setUploadQueue(prev =>
          prev.map(upload =>
            upload.id === uploadId ? { ...upload, status: 'completed', progress: 100 } : upload
          )
        );

        toast.success(`"${file.name}" uploaded successfully`);

      } catch (error: any) {
        // Update status to error
        const errorMessage = error.response?.data?.message || 'Upload failed';
        updateUploadStatus(uploadId, 'error', errorMessage);
        setUploadQueue(prev =>
          prev.map(upload =>
            upload.id === uploadId
              ? { ...upload, status: 'error', error: errorMessage }
              : upload
          )
        );

        toast.error(`Failed to upload "${file.name}": ${errorMessage}`);
      }
    }

    // Refresh files list
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    
    setIsUploading(false);
  };

  const handleClearQueue = () => {
    setUploadQueue([]);
  };

  const handleRetryUpload = async (uploadId: string) => {
    const fileToRetry = uploadQueue.find(upload => upload.id === uploadId);
    if (!fileToRetry) return;

 
    toast('Please re-select the file to upload again');
  };

  const handleRemoveFromQueue = (uploadId: string) => {
    setUploadQueue(prev => prev.filter(upload => upload.id !== uploadId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('image/')) return Image;
    return File;
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'uploading': return 'text-blue-600 dark:text-blue-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return <Check className="h-5 w-5 text-green-500" />;
      case 'uploading': return (
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const completedUploads = uploadQueue.filter(u => u.status === 'completed').length;
  const totalUploads = uploadQueue.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Files
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Drag and drop files or click to browse
          </p>
        </div>
        
        {uploadQueue.length > 0 && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {completedUploads} of {totalUploads} completed
            </div>
            <button
              onClick={handleClearQueue}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <DragDropUpload
          onUpload={handleFileUpload}
          multiple={true}
          disabled={isUploading}
        />
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload Queue ({uploadQueue.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {uploadQueue.map((upload) => {
              const FileIcon = getFileIcon(upload.type);
              const isUploading = upload.status === 'uploading';
              const isCompleted = upload.status === 'completed';
              const isError = upload.status === 'error';

              return (
                <div
                  key={upload.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <FileIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {upload.name}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(upload.size)}
                              </span>
                              <span className={`text-xs font-medium ${getStatusColor(upload.status)}`}>
                                {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Progress/Status */}
                          <div className="flex items-center space-x-4 ml-4">
                            <div className="w-24">
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isError
                                      ? 'bg-red-500'
                                      : isCompleted
                                      ? 'bg-green-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${upload.progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                                {upload.progress}%
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              {getStatusIcon(upload.status)}
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {isError && upload.error && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                              <p className="text-xs text-red-700 dark:text-red-300">
                                {upload.error}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRetryUpload(upload.id)}
                              className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Retry
                            </button>
                          </div>
                        )}

                        {/* Progress details for uploading files */}
                        {isUploading && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Uploading... {upload.progress}% complete
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 ml-4">
                      {!isUploading && !isCompleted && (
                        <button
                          onClick={() => handleRemoveFromQueue(upload.id)}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {completedUploads} files uploaded successfully •{' '}
                {uploadQueue.filter(u => u.status === 'error').length} failed
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Total: {formatFileSize(uploadQueue.reduce((sum, file) => sum + file.size, 0))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-4">
          Upload Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                Maximum file size: 100MB
              </span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                Supported formats: Images, Videos, Documents
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                Multiple files supported
              </span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-400">
                Resume failed uploads
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};