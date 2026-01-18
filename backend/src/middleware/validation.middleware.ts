import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body } from 'express-validator';
import { ValidationError, ApiResponse } from '../types';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'general',
      message: error.msg,
    }));

    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    };

    res.status(400).json(response);
  };
};

// Auth validation rules
export const registerValidation = validate([
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
]);

export const loginValidation = validate([
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

export const refreshTokenValidation = validate([
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string'),
]);

// File validation rules
export const uploadFileValidation = validate([
  body('originalName')
    .optional()
    .isString()
    .withMessage('Original name must be a string'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
]);

export const paginationValidation = validate([
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  body('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  body('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
]);

export const searchValidation = validate([
  body('searchTerm')
    .trim()
    .notEmpty()
    .withMessage('Search term is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
]);