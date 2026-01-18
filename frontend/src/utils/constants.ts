export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
export const MAX_FILES_PER_UPLOAD = 10;

export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
export const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'];

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const SORT_OPTIONS = [
  { value: 'uploadDate_desc', label: 'Newest First' },
  { value: 'uploadDate_asc', label: 'Oldest First' },
  { value: 'originalName_asc', label: 'Name (A-Z)' },
  { value: 'originalName_desc', label: 'Name (Z-A)' },
  { value: 'size_desc', label: 'Largest First' },
  { value: 'size_asc', label: 'Smallest First' },
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_ITEMS_PER_PAGE = 20;
export const DEFAULT_PAGE = 1;

export const STORAGE_COLORS = {
  low: '#10B981', // green
  medium: '#F59E0B', // yellow
  high: '#EF4444', // red
};

export const FILE_TYPE_ICONS = {
  pdf: 'FileText',
  doc: 'FileText',
  docx: 'FileText',
  xls: 'FileSpreadsheet',
  xlsx: 'FileSpreadsheet',
  ppt: 'FilePresentation',
  pptx: 'FilePresentation',
  txt: 'FileText',
  csv: 'FileSpreadsheet',
  jpg: 'Image',
  jpeg: 'Image',
  png: 'Image',
  gif: 'Image',
  webp: 'Image',
  svg: 'Image',
  mp4: 'Video',
  webm: 'Video',
  ogg: 'Video',
  mov: 'Video',
  default: 'File',
} as const;