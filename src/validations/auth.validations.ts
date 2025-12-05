// src/validations/auth.validations.ts
import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

// Validation schemas
const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
});

const loginPhoneOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
  otp: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be 6 digits",
      "any.required": "OTP is required",
    }),
});

const loginPhonePasswordSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
});

const loginUsernamePasswordSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    "string.alphanum": "Username must be alphanumeric",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must not exceed 50 characters",
    "any.required": "Username is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

// Validation middleware factory
function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw ApiError.unprocessableEntity("Validation failed", details);
    }

    req.body = value;
    next();
  };
}

// Export validation middleware
export const validateSendOtp = validate(sendOtpSchema);
export const validateLoginPhoneOtp = validate(loginPhoneOtpSchema);
export const validateLoginPhonePassword = validate(loginPhonePasswordSchema);
export const validateLoginUsernamePassword = validate(
  loginUsernamePasswordSchema
);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateLogout = validate(logoutSchema);
