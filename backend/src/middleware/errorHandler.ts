import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/httpErrors';
import { env } from '../config/environment';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  // Check if it's a known operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod Validation Errors
  else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = (err as any).format();
  }
  // Handle Mongo CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${(err as any).path}: ${(err as any).value}`;
  }
  // Handle Mongoose duplicate key error
  else if ((err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyValue)[0];
    message = `Duplicate field value entered: ${field}. Please use another value.`;
  }
  // Handle generic JWT verification error
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }
  // Handle Multer upload errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File size is too large. Maximum allowed size is 5 MiB.';
    } else {
      message = err.message;
    }
  }

  // Log unexpected errors (operational errors do not clutter logs)
  if (statusCode === 500) {
    console.error('💥 Unexpected Server Error:', err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
