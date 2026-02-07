// Unit tests for staff validation with array fields
import {
  validateCreateClinician,
  validateUpdateClinician,
} from "../staff.validation";
import { ApiError } from "../../utils/apiError";

describe("Staff Validation Unit Tests", () => {
  describe("validateCreateClinician", () => {
    const validInput = {
      user_id: 1,
      primary_centre_id: 1,
      specialization: ["Clinical Psychology", "Psychiatry"],
      years_of_experience: 5,
      consultation_fee: 1500,
      registration_number: "REG123",
      bio: "Experienced therapist",
      consultation_modes: ["IN_PERSON", "ONLINE"],
      default_consultation_duration_minutes: 30,
      qualification: ["PhD in Psychology", "MD"],
      expertise: ["Anxiety", "Depression"],
      languages: ["English", "Hindi"],
    };

    it("should validate correct clinician data with arrays", () => {
      const result = validateCreateClinician(validInput);

      expect(result.user_id).toBe(1);
      expect(result.primary_centre_id).toBe(1);
      expect(Array.isArray(result.specialization)).toBe(true);
      expect(result.specialization).toEqual([
        "Clinical Psychology",
        "Psychiatry",
      ]);
      expect(result.years_of_experience).toBe(5);
      expect(result.consultation_fee).toBe(1500);
    });

    it("should accept single specialization in array", () => {
      const input = {
        ...validInput,
        specialization: ["Clinical Psychology"],
      };

      const result = validateCreateClinician(input);

      expect(result.specialization).toEqual(["Clinical Psychology"]);
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

    it("should throw error if specialization is empty array", () => {
      const input = { ...validInput, specialization: [] };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "Specialization is required",
      );
    });

    it("should throw error if specialization is not an array", () => {
      const input = {
        ...validInput,
        specialization: "Clinical Psychology" as any,
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "must be a non-empty array",
      );
    });

    it("should accept optional qualification array", () => {
      const input = {
        ...validInput,
        qualification: ["MBBS", "MD", "DPM"],
      };

      const result = validateCreateClinician(input);

      expect(result.qualification).toEqual(["MBBS", "MD", "DPM"]);
    });

    it("should throw error if qualification is not an array", () => {
      const input = {
        ...validInput,
        qualification: "MBBS" as any,
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "qualification must be an array",
      );
    });

    it("should accept optional fields as undefined", () => {
      const minimalInput = {
        user_id: 1,
        primary_centre_id: 1,
        specialization: ["Psychiatry"],
      };

      const result = validateCreateClinician(minimalInput);

      expect(result.user_id).toBe(1);
      expect(result.primary_centre_id).toBe(1);
      expect(result.specialization).toEqual(["Psychiatry"]);
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

    it("should throw error for invalid consultation_modes", () => {
      const input = {
        ...validInput,
        consultation_modes: ["INVALID_MODE"] as any,
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "consultation_modes must contain only IN_PERSON or ONLINE",
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
        expertise: "Anxiety" as any,
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
        languages: "English" as any,
      };

      expect(() => validateCreateClinician(input)).toThrow(ApiError);
      expect(() => validateCreateClinician(input)).toThrow(
        "languages must be an array",
      );
    });
  });

  describe("validateUpdateClinician", () => {
    it("should validate partial update with specialization array", () => {
      const input = {
        specialization: ["Child Psychology", "Adolescent Psychology"],
      };

      const result = validateUpdateClinician(input);

      expect(result.specialization).toEqual([
        "Child Psychology",
        "Adolescent Psychology",
      ]);
    });

    it("should throw error if specialization is empty array", () => {
      const input = {
        specialization: [],
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "must be a non-empty array",
      );
    });

    it("should throw error if specialization is not an array", () => {
      const input = {
        specialization: "Child Psychology" as any,
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "must be a non-empty array",
      );
    });

    it("should validate qualification array update", () => {
      const input = {
        qualification: ["MBBS", "MD", "DPM"],
      };

      const result = validateUpdateClinician(input);

      expect(result.qualification).toEqual(["MBBS", "MD", "DPM"]);
    });

    it("should throw error if qualification is not an array", () => {
      const input = {
        qualification: "MBBS" as any,
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "qualification must be an array",
      );
    });

    it("should throw error for empty update", () => {
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

    it("should throw error for invalid consultation_modes", () => {
      const input = {
        consultation_modes: ["INVALID"] as any,
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "consultation_modes must contain only IN_PERSON or ONLINE",
      );
    });

    it("should validate multiple field updates", () => {
      const input = {
        specialization: ["Updated Specialization"],
        years_of_experience: 10,
        consultation_fee: 2000,
      };

      const result = validateUpdateClinician(input);

      expect(result.specialization).toEqual(["Updated Specialization"]);
      expect(result.years_of_experience).toBe(10);
      expect(result.consultation_fee).toBe(2000);
    });

    it("should accept zero years_of_experience", () => {
      const input = {
        years_of_experience: 0,
      };

      const result = validateUpdateClinician(input);

      expect(result.years_of_experience).toBe(0);
    });

    it("should validate default_consultation_duration_minutes", () => {
      const input = {
        default_consultation_duration_minutes: 60,
      };

      const result = validateUpdateClinician(input);

      expect(result.default_consultation_duration_minutes).toBe(60);
    });

    it("should throw error for invalid default_consultation_duration_minutes", () => {
      const input = {
        default_consultation_duration_minutes: 0,
      };

      expect(() => validateUpdateClinician(input)).toThrow(ApiError);
      expect(() => validateUpdateClinician(input)).toThrow(
        "default_consultation_duration_minutes must be at least 1",
      );
    });
  });
});
