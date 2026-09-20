/**
 * Base Application Custom Error Class.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Array<{ field?: string; message: string }>;

  constructor(
    message = "Validation failed",
    errors: Array<{ field?: string; message: string }> = []
  ) {
    super(message, 400);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied: Insufficient permissions") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Requested resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict occurred") {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation error") {
    super(message, 500);
  }
}
