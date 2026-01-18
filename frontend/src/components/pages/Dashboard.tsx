/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  FileText,
  Video,
  Image,
  HardDrive,
  BarChart3,
  Clock,
  TrendingUp,
  Download,
  Upload as UploadIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../api/apiClient";
import { FileList } from "../common/FileList";
import { useUIStore } from "../../stores/ui.store";
import { toast } from "react-hot-toast";

interface DashboardStats {
  totalFiles: number;
  totalVideos: number;
  totalImages: number;
  totalDocuments: number;
  totalSize: number;
  usedPercentage: number;
  recentFiles: any[];
  uploadsToday: number;
}

export const Dashboard: React.FC = () => {
  //   const { setCurrentPage, setItemsPerPage } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  console.log("stats",stats)

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: DashboardStats;
      }>("/files/stats");
      return response.data;
    },
  });

  // Fetch recent files
  const { data: recentFiles, isLoading: filesLoading } = useQuery({
    queryKey: ["recent-files"],
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: any;
      }>("/files/list?page=1&limit=5&sortBy=uploadDate&sortOrder=desc");
      return response.data.data;
    },
  });

  useEffect(() => {
    if (statsData) {
      setStats(statsData?.stats);
    }
  }, [statsData]);

  const formatBytes = (value : number): string => {
    const bytes =
      typeof value === "number" && Number.isFinite(value) ? value : 0;

    if (bytes <= 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageColor = (percentage: number): string => {
    if (percentage < 50) return "text-green-600 dark:text-green-400";
    if (percentage < 80) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Last updated: Just now</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Files */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Files
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalFiles || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
        </div>

        {/* Videos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Videos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalVideos || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Video className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+8% from last month</span>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Images
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats?.totalImages || 0}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Image className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+15% from last month</span>
            </div>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Storage Used
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {stats ? formatBytes(stats.totalSize) : "0 Bytes"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <HardDrive className="h-6 w-6 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${getStorageColor(
                  stats?.usedPercentage || 0
                )}`}
              >
                {stats?.usedPercentage?.toFixed(1) || 0}% used
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                100GB limit
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (stats?.usedPercentage || 0) < 50
                    ? "bg-green-500"
                    : (stats?.usedPercentage || 0) < 80
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(stats?.usedPercentage || 0, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recent Files
                </h2>
                <button
                  onClick={() => {
                    // Navigate to files page
                    window.location.href = "/files";
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View all
                </button>
              </div>
            </div>
            <div className="p-6">
              {filesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : recentFiles?.data && recentFiles.data.length > 0 ? (
                <div className="space-y-4">
                  {recentFiles.data.slice(0, 5).map((file: any) => (
                    <div
                      key={file._id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          {file.isVideo ? (
                            <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          ) : file.mimeType.startsWith("image/") ? (
                            <Image className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(file.uploadDate)?.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No recent files
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Uploads Today */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Uploads Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats?.uploadsToday || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <UploadIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  window.location.href = "/upload";
                }}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Upload Files
              </button>
            </div>
          </div>

          {/* Download Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Downloads Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  24
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Download className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>+18% from yesterday</span>
              </div>
            </div>
          </div>

          {/* File Types Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              File Types
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Documents
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats?.totalDocuments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Videos
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats?.totalVideos || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Images
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats?.totalImages || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
