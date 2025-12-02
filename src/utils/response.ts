// src/utils/response.ts
import { Response } from "express";

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, message?: string) {
  const payload: SuccessResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(200).json(payload);
}

export function created<T>(res: Response, data: T, message?: string) {
  const payload: SuccessResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(201).json(payload);
}

export function error(
  res: Response,
  status: number,
  message: string,
  details?: unknown
) {
  const payload: ErrorResponse = {
    success: false,
    message,
    details,
  };
  return res.status(status).json(payload);
}
