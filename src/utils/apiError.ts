// src/utils/apiError.ts
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Operational errors are expected errors
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // 400 Bad Request
  static badRequest(message: string = "Bad request", details?: any) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  // 401 Unauthorized
  static unauthorized(message: string = "Unauthorized") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  // 403 Forbidden
  static forbidden(message: string = "Access denied") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  // 404 Not Found
  static notFound(message: string = "Resource not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  // 409 Conflict
  static conflict(message: string = "Resource conflict") {
    return new ApiError(409, "CONFLICT", message);
  }

  // 422 Unprocessable Entity
  static unprocessableEntity(
    message: string = "Validation failed",
    details?: any
  ) {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }

  // 500 Internal Server Error
  static internal(message: string = "Internal server error", details?: any) {
    return new ApiError(500, "INTERNAL_ERROR", message, details);
  }

  // 503 Service Unavailable
  static serviceUnavailable(message: string = "Service unavailable") {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message);
  }
}

/**
 * Handle database errors and convert to ApiError
 */
export function handleDatabaseError(error: any): ApiError {
  // PostgreSQL error codes
  if (error.code === "23505") {
    // Unique violation
    return ApiError.conflict("Resource already exists");
  }

  if (error.code === "23503") {
    // Foreign key violation
    return ApiError.badRequest("Referenced resource does not exist");
  }

  if (error.code === "23502") {
    // Not null violation
    return ApiError.badRequest("Required field is missing");
  }

  if (error.code === "22P02") {
    // Invalid text representation
    return ApiError.badRequest("Invalid data format");
  }

  if (error.code === "42P01") {
    // Undefined table
    return ApiError.internal("Database schema error");
  }

  // Connection errors
  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    return ApiError.serviceUnavailable("Database connection failed");
  }

  // Generic database error
  return ApiError.internal("Database operation failed");
}
