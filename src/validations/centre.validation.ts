// src/validations/centre.validation.ts
import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

const createCentreSchema = Joi.object({
  name: Joi.string().min(3).max(150).required().messages({
    "string.min": "Centre name must be at least 3 characters",
    "string.max": "Centre name must not exceed 150 characters",
    "any.required": "Centre name is required",
  }),
  city: Joi.string()
    .valid("bangalore", "kochi", "mumbai", "Bangalore", "Kochi", "Mumbai")
    .required()
    .messages({
      "any.only": "City must be bangalore, kochi, or mumbai",
      "any.required": "City is required",
    }),
  addressLine1: Joi.string().max(255).required().messages({
    "string.max": "Address line 1 must not exceed 255 characters",
    "any.required": "Address line 1 is required",
  }),
  addressLine2: Joi.string().max(255).allow("", null).optional().messages({
    "string.max": "Address line 2 must not exceed 255 characters",
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Pincode must be 6 digits",
      "any.required": "Pincode is required",
    }),
  contactPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Contact phone must be 10 digits",
      "any.required": "Contact phone is required",
    }),
});

const updateCentreSchema = Joi.object({
  name: Joi.string().min(3).max(150).optional().messages({
    "string.min": "Centre name must be at least 3 characters",
    "string.max": "Centre name must not exceed 150 characters",
  }),
  city: Joi.string()
    .valid("bangalore", "kochi", "mumbai", "Bangalore", "Kochi", "Mumbai")
    .optional()
    .messages({
      "any.only": "City must be bangalore, kochi, or mumbai",
    }),
  addressLine1: Joi.string().max(255).optional().messages({
    "string.max": "Address line 1 must not exceed 255 characters",
  }),
  addressLine2: Joi.string().max(255).allow("", null).optional().messages({
    "string.max": "Address line 2 must not exceed 255 characters",
  }),
  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .optional()
    .messages({
      "string.pattern.base": "Pincode must be 6 digits",
    }),
  contactPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Contact phone must be 10 digits",
    }),
}).min(1);

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

export const validateCreateCentre = validate(createCentreSchema);
export const validateUpdateCentre = validate(updateCentreSchema);
