import { Request } from 'express';
import { Types } from 'mongoose';

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: UserTokenPayload;
  accessToken?: string;
}

export interface JWTTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: Types.ObjectId;
  path: string;
  isVideo: boolean;
  duration?: number;
  thumbnailPath?: string;
  uploadDate: Date;
}

export interface VideoStreamRange {
  start: number;
  end: number;
  size: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}