import { Request, Response, NextFunction } from 'express';
import { ValidationError, ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: ValidationError[]
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
      errors: err.errors,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'general', message: err.message }],
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid token',
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      message: 'Token expired',
    };
    res.status(401).json(response);
    return;
  }

  // Handle Mongoose errors
  if (err.name === 'CastError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid ID format',
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const response: ApiResponse = {
      success: false,
      message: 'Duplicate key error',
    };
    res.status(409).json(response);
    return;
  }

  // Default error
  const response: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  };
  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};