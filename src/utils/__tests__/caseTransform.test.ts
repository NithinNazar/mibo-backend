// src/utils/__tests__/caseTransform.test.ts
import {
  transformToCamelCase,
  transformToSnakeCase,
  transformClinicianResponse,
} from "../caseTransform";

describe("caseTransform utilities", () => {
  describe("transformToCamelCase", () => {
    it("should convert snake_case keys to camelCase", () => {
      const input = {
        first_name: "John",
        last_name: "Doe",
        email_address: "john@example.com",
      };

      const expected = {
        firstName: "John",
        lastName: "Doe",
        emailAddress: "john@example.com",
      };

      expect(transformToCamelCase(input)).toEqual(expected);
    });

    it("should handle nested objects", () => {
      const input = {
        user_info: {
          first_name: "John",
          contact_details: {
            phone_number: "1234567890",
          },
        },
      };

      const expected = {
        userInfo: {
          firstName: "John",
          contactDetails: {
            phoneNumber: "1234567890",
          },
        },
      };

      expect(transformToCamelCase(input)).toEqual(expected);
    });

    it("should handle arrays", () => {
      const input = [
        { user_id: 1, full_name: "John" },
        { user_id: 2, full_name: "Jane" },
      ];

      const expected = [
        { userId: 1, fullName: "John" },
        { userId: 2, fullName: "Jane" },
      ];

      expect(transformToCamelCase(input)).toEqual(expected);
    });

    it("should handle null and undefined", () => {
      expect(transformToCamelCase(null)).toBeNull();
      expect(transformToCamelCase(undefined)).toBeUndefined();
    });

    it("should handle primitive values", () => {
      expect(transformToCamelCase("string")).toBe("string");
      expect(transformToCamelCase(123)).toBe(123);
      expect(transformToCamelCase(true)).toBe(true);
    });

    it("should handle empty objects", () => {
      expect(transformToCamelCase({})).toEqual({});
    });

    it("should handle empty arrays", () => {
      expect(transformToCamelCase([])).toEqual([]);
    });
  });

  describe("transformToSnakeCase", () => {
    it("should convert camelCase keys to snake_case", () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        emailAddress: "john@example.com",
      };

      const expected = {
        first_name: "John",
        last_name: "Doe",
        email_address: "john@example.com",
      };

      expect(transformToSnakeCase(input)).toEqual(expected);
    });

    it("should handle nested objects", () => {
      const input = {
        userInfo: {
          firstName: "John",
          contactDetails: {
            phoneNumber: "1234567890",
          },
        },
      };

      const expected = {
        user_info: {
          first_name: "John",
          contact_details: {
            phone_number: "1234567890",
          },
        },
      };

      expect(transformToSnakeCase(input)).toEqual(expected);
    });

    it("should handle arrays", () => {
      const input = [
        { userId: 1, fullName: "John" },
        { userId: 2, fullName: "Jane" },
      ];

      const expected = [
        { user_id: 1, full_name: "John" },
        { user_id: 2, full_name: "Jane" },
      ];

      expect(transformToSnakeCase(input)).toEqual(expected);
    });

    it("should handle null and undefined", () => {
      expect(transformToSnakeCase(null)).toBeNull();
      expect(transformToSnakeCase(undefined)).toBeUndefined();
    });
  });

  describe("transformClinicianResponse", () => {
    it("should transform clinician object with all fields", () => {
      const input = {
        id: 1,
        user_id: 10,
        full_name: "Dr. John Doe",
        years_of_experience: 5,
        primary_centre_id: 2,
        primary_centre_name: "Bangalore Centre",
        consultation_fee: 1500,
        registration_number: "REG123",
        consultation_modes: ["IN_PERSON", "ONLINE"],
        default_consultation_duration_minutes: 30,
        profile_picture_url: "https://example.com/pic.jpg",
        specialization: "Clinical Psychology",
      };

      const result = transformClinicianResponse(input);

      expect(result.yearsOfExperience).toBe(5);
      expect(result.primaryCentreId).toBe(2);
      expect(result.primaryCentreName).toBe("Bangalore Centre");
      expect(result.consultationFee).toBe(1500);
      expect(result.registrationNumber).toBe("REG123");
      expect(result.consultationModes).toEqual(["IN_PERSON", "ONLINE"]);
      expect(result.defaultDurationMinutes).toBe(30);
      expect(result.profilePictureUrl).toBe("https://example.com/pic.jpg");
    });

    it("should handle partial clinician data", () => {
      const input = {
        id: 1,
        full_name: "Dr. Jane Smith",
        years_of_experience: 3,
        consultation_fee: 2000,
      };

      const result = transformClinicianResponse(input);

      expect(result.yearsOfExperience).toBe(3);
      expect(result.consultationFee).toBe(2000);
      expect(result.fullName).toBe("Dr. Jane Smith");
    });

    it("should handle null clinician", () => {
      expect(transformClinicianResponse(null)).toBeNull();
    });

    it("should handle undefined clinician", () => {
      expect(transformClinicianResponse(undefined)).toBeUndefined();
    });

    it("should handle clinician with zero experience", () => {
      const input = {
        id: 1,
        years_of_experience: 0,
        consultation_fee: 1000,
      };

      const result = transformClinicianResponse(input);

      expect(result.yearsOfExperience).toBe(0);
      expect(result.consultationFee).toBe(1000);
    });

    it("should handle clinician with missing optional fields", () => {
      const input = {
        id: 1,
        user_id: 10,
        full_name: "Dr. Test",
        specialization: "Psychiatry",
      };

      const result = transformClinicianResponse(input);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(10);
      expect(result.fullName).toBe("Dr. Test");
      expect(result.specialization).toBe("Psychiatry");
      expect(result.yearsOfExperience).toBeUndefined();
      expect(result.consultationFee).toBeUndefined();
    });

    it("should preserve non-transformed fields", () => {
      const input = {
        id: 1,
        specialization: "Clinical Psychology",
        bio: "Experienced therapist",
        is_active: true,
      };

      const result = transformClinicianResponse(input);

      expect(result.id).toBe(1);
      expect(result.specialization).toBe("Clinical Psychology");
      expect(result.bio).toBe("Experienced therapist");
      expect(result.isActive).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle objects with numeric keys", () => {
      const input = {
        user_id: 1,
        "123": "numeric key",
      };

      const result = transformToCamelCase(input);

      expect(result.userId).toBe(1);
      expect(result["123"]).toBe("numeric key");
    });

    it("should handle objects with special characters in values", () => {
      const input = {
        user_name: "John_Doe",
        email: "john@example.com",
      };

      const result = transformToCamelCase(input);

      expect(result.userName).toBe("John_Doe");
      expect(result.email).toBe("john@example.com");
    });

    it("should handle deeply nested structures", () => {
      const input = {
        level_1: {
          level_2: {
            level_3: {
              deep_value: "test",
            },
          },
        },
      };

      const result: any = transformToCamelCase(input);

      // The transformation converts level_1 to level1, level_2 to level2, etc.
      expect(result.level1).toBeDefined();
      expect(result.level1.level2).toBeDefined();
      expect(result.level1.level2.level3).toBeDefined();
      expect(result.level1.level2.level3.deepValue).toBe("test");
    });

    it("should handle mixed arrays and objects", () => {
      const input = {
        user_list: [
          { user_id: 1, user_name: "John" },
          { user_id: 2, user_name: "Jane" },
        ],
        meta_data: {
          total_count: 2,
        },
      };

      const result = transformToCamelCase(input);

      expect(result.userList).toHaveLength(2);
      expect(result.userList[0].userId).toBe(1);
      expect(result.userList[0].userName).toBe("John");
      expect(result.metaData.totalCount).toBe(2);
    });
  });
});
