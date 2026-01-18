/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Image,
  Video,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  Clock,
  HardDrive,
} from 'lucide-react';
import { formatDistanceToNow, formatBytes } from '../../utils/format';
import { FILE_TYPE_ICONS } from '../../utils/constants';
import { useUIStore } from '../../stores/ui.store';

interface File {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  isVideo: boolean;
  duration?: number;
  thumbnailPath?: string;
  uploadDate: string;
  ownerId: string;
}

interface FileListProps {
  files: File[];
  isLoading?: boolean;
  onDelete?: (fileId: string) => void;
  onView?: (file: File) => void;
  onDownload?: (file: File) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading = false,
  onDelete,
  onView,
  onDownload,
}) => {
  const { sortBy, sortOrder } = useUIStore();
  const [sortedFiles, setSortedFiles] = useState<File[]>(files);

  // Sort files based on sort options
  useEffect(() => {
    const sorted = [...files].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'uploadDate':
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
          break;
        case 'originalName':
          aValue = a.originalName.toLowerCase();
          bValue = b.originalName.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        default:
          aValue = new Date(a.uploadDate).getTime();
          bValue = new Date(b.uploadDate).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setSortedFiles(sorted);
  }, [files, sortBy, sortOrder]);

  const getFileIcon = (mimeType: string, isVideo: boolean) => {
    if (isVideo) return Video;
    
    const type = mimeType.split('/')[0];
    const extension = mimeType.split('/')[1];
    
    switch (type) {
      case 'image':
        return Image;
      case 'application':
        if (extension.includes('pdf')) return FileText;
        if (extension.includes('word') || extension.includes('document')) return FileText;
        if (extension.includes('excel') || extension.includes('sheet')) return FileText;
        if (extension.includes('powerpoint') || extension.includes('presentation')) return FileText;
        return FileText;
      default:
        return FileText;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg p-4 h-20"
          />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No files found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload some files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Duration
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Uploaded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {sortedFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType, file.isVideo);
            
            return (
              <tr
                key={file._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <FileIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {file.originalName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {file.mimeType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {file.isVideo ? 'Video' : file.mimeType.split('/')[0].charAt(0).toUpperCase() + file.mimeType.split('/')[0].slice(1)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900 dark:text-white">
                    <HardDrive className="h-4 w-4 mr-2 text-gray-400" />
                    {formatBytes(file.size)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900 dark:text-white">
                    {file.isVideo && file.duration ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDuration(file.duration)}
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDistanceToNow(new Date(file.uploadDate), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {onView && (
                      <button
                        onClick={() => onView(file)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    )}
                    
                    {onDownload && (
                      <button
                        onClick={() => onDownload(file)}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Download"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={() => onDelete(file._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

