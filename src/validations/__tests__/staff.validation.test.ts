// src/validations/__tests__/staff.validation.test.ts
import {
  validateCreateClinician,
  validateUpdateClinician,
} from "../staff.validation";
import { ApiError } from "../../utils/apiError";

describe("Staff Validation", () => {
  describe("validateCreateClinician", () => {
    const validInput = {
      user_id: 1,
      primary_centre_id: 1,
      specialization: "Clinical Psychology",
      years_of_experience: 5,
      consultation_fee: 1500,
      registration_number: "REG123",
      bio: "Experienced therapist",
      consultation_modes: ["IN_PERSON", "ONLINE"],
      default_consultation_duration_minutes: 30,
      qualification: "PhD in Psychology",
      expertise: ["Anxiety", "Depression"],
      languages: ["English", "Hindi"],
    };

    it("should validate correct clinician data", () => {
      const result = validateCreateClinician(validInput);

      expect(result.user_id).toBe(1);
      expect(result.primary_centre_id).toBe(1);
      expect(result.specialization).toBe("Clinical Psychology");
      expect(result.years_of_experience).toBe(5);
      expect(result.consultation_fee).toBe(1500);
    });

    it("should accept years_of_experience field", () => {
      const input = {
        ...validInput,
        years_of_experience: 7,
      };

      const result = validateCreateClinician(input);

      expect(result.years_of_experience).toBe(7);
    });

    it("should throw error if user_id is missing", () => {
      const input = { ...validInput };
      delete (input as any).user_id;

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "user_id is required",
      );
    });

    it("should throw error if primary_centre_id is missing", () => {
      const input = { ...validInput };
      delete (input as any).primary_centre_id;

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "primary_centre_id is required",
      );
    });

    it("should throw error if specialization is missing", () => {
      const input = { ...validInput };
      delete (input as any).specialization;

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "Specialization is required",
      );
    });

    it("should throw error if specialization is empty string", () => {
      const input = { ...validInput, specialization: "   " };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "Specialization is required",
      );
    });

    it("should accept optional fields as undefined", () => {
      const minimalInput = {
        user_id: 1,
        primary_centre_id: 1,
        specialization: "Psychiatry",
      };

      const result = validateCreateClinician(minimalInput);

      expect(result.user_id).toBe(1);
      expect(result.primary_centre_id).toBe(1);
      expect(result.specialization).toBe("Psychiatry");
      expect(result.years_of_experience).toBeUndefined();
      expect(result.consultation_fee).toBeUndefined();
    });

    it("should validate consultation_modes array", () => {
      const input = {
        ...validInput,
        consultation_modes: ["IN_PERSON", "ONLINE"],
      };

      const result = validateCreateClinician(input);

      expect(result.consultation_modes).toEqual(["IN_PERSON", "ONLINE"]);
    });

    it("should throw error for invalid consultation_mode", () => {
      const input = {
        ...validInput,
        consultation_modes: ["INVALID_MODE"],
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "consultation_modes must contain only IN_PERSON or ONLINE",
      );
    });

    it("should throw error if consultation_modes is not an array", () => {
      const input = {
        ...validInput,
        consultation_modes: "IN_PERSON",
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "consultation_modes must be an array",
      );
    });

    it("should validate expertise array", () => {
      const input = {
        ...validInput,
        expertise: ["Anxiety", "Depression", "PTSD"],
      };

      const result = validateCreateClinician(input);

      expect(result.expertise).toEqual(["Anxiety", "Depression", "PTSD"]);
    });

    it("should throw error if expertise is not an array", () => {
      const input = {
        ...validInput,
        expertise: "Anxiety",
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "expertise must be an array",
      );
    });

    it("should validate languages array", () => {
      const input = {
        ...validInput,
        languages: ["English", "Hindi", "Malayalam"],
      };

      const result = validateCreateClinician(input);

      expect(result.languages).toEqual(["English", "Hindi", "Malayalam"]);
    });

    it("should throw error if languages is not an array", () => {
      const input = {
        ...validInput,
        languages: "English",
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "languages must be an array",
      );
    });

    it("should convert numeric strings to numbers", () => {
      const input = {
        ...validInput,
        user_id: "10",
        primary_centre_id: "5",
        years_of_experience: "7",
        consultation_fee: "2000",
      };

      const result = validateCreateClinician(input as any);

      expect(result.user_id).toBe(10);
      expect(result.primary_centre_id).toBe(5);
      expect(result.years_of_experience).toBe(7);
      expect(result.consultation_fee).toBe(2000);
    });

    it("should trim string fields", () => {
      const input = {
        ...validInput,
        specialization: "  Clinical Psychology  ",
        registration_number: "  REG123  ",
        bio: "  Experienced therapist  ",
        qualification: "  PhD  ",
      };

      const result = validateCreateClinician(input);

      expect(result.specialization).toBe("Clinical Psychology");
      expect(result.registration_number).toBe("REG123");
      expect(result.bio).toBe("Experienced therapist");
      expect(result.qualification).toBe("PhD");
    });

    it("should validate default_consultation_duration_minutes", () => {
      const input = {
        ...validInput,
        default_consultation_duration_minutes: 45,
      };

      const result = validateCreateClinician(input);

      expect(result.default_consultation_duration_minutes).toBe(45);
    });

    it("should throw error if duration is less than 1", () => {
      const input = {
        ...validInput,
        default_consultation_duration_minutes: 0,
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "default_consultation_duration_minutes must be at least 1",
      );
    });
  });

  describe("validateUpdateClinician", () => {
    it("should validate partial update with years_of_experience", () => {
      const input = {
        years_of_experience: 8,
        consultation_fee: 2500,
      };

      const result = validateUpdateClinician(input);

      expect(result.years_of_experience).toBe(8);
      expect(result.consultation_fee).toBe(2500);
    });

    it("should validate single field update", () => {
      const input = {
        specialization: "Child Psychology",
      };

      const result = validateUpdateClinician(input);

      expect(result.specialization).toBe("Child Psychology");
      expect(Object.keys(result)).toHaveLength(1);
    });

    it("should throw error if specialization is empty", () => {
      const input = {
        specialization: "   ",
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "Specialization cannot be empty",
      );
    });

    it("should throw error if no fields to update", () => {
      const input = {};

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow("Nothing to update");
    });

    it("should validate consultation_modes update", () => {
      const input = {
        consultation_modes: ["ONLINE"],
      };

      const result = validateUpdateClinician(input);

      expect(result.consultation_modes).toEqual(["ONLINE"]);
    });

    it("should throw error for invalid consultation_mode in update", () => {
      const input = {
        consultation_modes: ["INVALID"],
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "consultation_modes must contain only IN_PERSON or ONLINE",
      );
    });

    it("should convert numeric strings in update", () => {
      const input = {
        years_of_experience: "10",
        consultation_fee: "3000",
        primary_centre_id: "2",
      };

      const result = validateUpdateClinician(input as any);

      expect(result.years_of_experience).toBe(10);
      expect(result.consultation_fee).toBe(3000);
      expect(result.primary_centre_id).toBe(2);
    });

    it("should trim strings in update", () => {
      const input = {
        specialization: "  Updated Specialization  ",
        registration_number: "  REG456  ",
        bio: "  Updated bio  ",
      };

      const result = validateUpdateClinician(input);

      expect(result.specialization).toBe("Updated Specialization");
      expect(result.registration_number).toBe("REG456");
      expect(result.bio).toBe("Updated bio");
    });

    it("should allow updating to zero experience", () => {
      const input = {
        years_of_experience: 0,
      };

      const result = validateUpdateClinician(input);

      expect(result.years_of_experience).toBe(0);
    });

    it("should validate duration update", () => {
      const input = {
        default_consultation_duration_minutes: 60,
      };

      const result = validateUpdateClinician(input);

      expect(result.default_consultation_duration_minutes).toBe(60);
    });

    it("should throw error if duration is invalid in update", () => {
      const input = {
        default_consultation_duration_minutes: -5,
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "default_consultation_duration_minutes must be at least 1",
      );
    });
  });
});
