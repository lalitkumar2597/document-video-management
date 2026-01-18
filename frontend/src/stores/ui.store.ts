import { create } from 'zustand';

interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'| 'error';
  error?: string;
}

interface UIState {
  // Upload state
  uploads: UploadProgress[];
  isUploadModalOpen: boolean;
  
  // File list state
  currentPage: number;
  itemsPerPage: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  
  // UI state
  sidebarOpen: boolean;
  darkMode: boolean;
  
  // Actions
  addUpload: (upload: Omit<UploadProgress, 'progress' | 'status' | 'error'>) => string;
  updateUploadProgress: (fileId: string, progress: number) => void;
  updateUploadStatus: (fileId: string, status: UploadProgress['status'], error?: string) => void;
  removeUpload: (fileId: string) => void;
  clearCompletedUploads: () => void;
  
  setUploadModalOpen: (open: boolean) => void;
  
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  uploads: [],
  isUploadModalOpen: false,
  
  currentPage: 1,
  itemsPerPage: 20,
  sortBy: 'uploadDate',
  sortOrder: 'desc',
  searchTerm: '',
  
  sidebarOpen: true,
  darkMode: false,
  
  addUpload: (upload) => {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: UploadProgress = {
      ...upload,
      progress: 0,
      status: 'pending',
    };
    
    set((state) => ({
      uploads: [...state.uploads, newUpload],
    }));
    
    return fileId;
  },
  
  updateUploadProgress: (fileId, progress) =>
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.fileId === fileId
          ? { ...upload, progress, status: 'uploading' }
          : upload
      ),
    })),
  
  updateUploadStatus: (fileId, status, error) =>
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.fileId === fileId
          ? { ...upload, status, error }
          : upload
      ),
    })),
  
  removeUpload: (fileId) =>
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.fileId !== fileId),
    })),
  
  clearCompletedUploads: () =>
    set((state) => ({
      uploads: state.uploads.filter(
        (upload) => upload.status !== 'completed' && upload.status !== 'failed'
      ),
    })),
  
  setUploadModalOpen: (open) =>
    set({
      isUploadModalOpen: open,
    }),
  
  setCurrentPage: (page) =>
    set({
      currentPage: page,
    }),
  
  setItemsPerPage: (limit) =>
    set({
      itemsPerPage: limit,
      currentPage: 1, // Reset to first page when changing items per page
    }),
  
  setSortBy: (sortBy) =>
    set({
      sortBy,
    }),
  
  setSortOrder: (order) =>
    set({
      sortOrder: order,
    }),
  
  setSearchTerm: (term) =>
    set({
      searchTerm: term,
      currentPage: 1, // Reset to first page when searching
    }),
  
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  
  setSidebarOpen: (open) =>
    set({
      sidebarOpen: open,
    }),
  
  toggleDarkMode: () =>
    set((state) => ({
      darkMode: !state.darkMode,
    })),
}));