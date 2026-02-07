// Feature: dynamic-clinician-management, Property 4: Array Field Storage
// Property: For any clinician with multiple specializations or qualifications,
// storing the clinician should preserve all array elements, and retrieving
// the clinician should return the arrays in the same order.

import * as fc from "fast-check";
import {
  validateCreateClinician,
  validateUpdateClinician,
} from "../staff.validation";

describe("Property Tests: Array Field Storage", () => {
  // Property 4: Array Field Storage
  describe("Property 4: Specialization and Qualification Array Storage", () => {
    it("should preserve specialization array elements and order", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (specializations, userId, centreId) => {
            const input = {
              user_id: userId,
              primary_centre_id: centreId,
              specialization: specializations,
            };

            const result = validateCreateClinician(input);

            // Verify array is preserved
            expect(Array.isArray(result.specialization)).toBe(true);
            expect(result.specialization).toHaveLength(specializations.length);

            // Verify order is preserved
            result.specialization.forEach((spec, index) => {
              expect(spec.trim()).toBe(specializations[index].trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve qualification array elements and order", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
            minLength: 0,
            maxLength: 5,
          }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (specializations, qualifications, userId, centreId) => {
            const input = {
              user_id: userId,
              primary_centre_id: centreId,
              specialization: specializations,
              qualification:
                qualifications.length > 0 ? qualifications : undefined,
            };

            const result = validateCreateClinician(input);

            // Verify specialization array
            expect(Array.isArray(result.specialization)).toBe(true);
            expect(result.specialization).toHaveLength(specializations.length);

            // Verify qualification array if provided
            if (qualifications.length > 0) {
              expect(Array.isArray(result.qualification)).toBe(true);
              expect(result.qualification).toHaveLength(qualifications.length);

              result.qualification!.forEach((qual, index) => {
                expect(qual.trim()).toBe(qualifications[index].trim());
              });
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve expertise and languages array elements", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 3,
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (specializations, expertise, languages, userId, centreId) => {
            const input = {
              user_id: userId,
              primary_centre_id: centreId,
              specialization: specializations,
              expertise,
              languages,
            };

            const result = validateCreateClinician(input);

            // Verify all arrays are preserved
            expect(Array.isArray(result.expertise)).toBe(true);
            expect(result.expertise).toHaveLength(expertise.length);

            expect(Array.isArray(result.languages)).toBe(true);
            expect(result.languages).toHaveLength(languages.length);

            // Verify order is preserved
            result.expertise!.forEach((exp, index) => {
              expect(exp.trim()).toBe(expertise[index].trim());
            });

            result.languages!.forEach((lang, index) => {
              expect(lang.trim()).toBe(languages[index].trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle update with partial array fields", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 3,
          }),
          fc.option(
            fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
              minLength: 1,
              maxLength: 3,
            }),
            { nil: undefined },
          ),
          (specializations, qualifications) => {
            const input: any = {
              specialization: specializations,
            };

            if (qualifications !== undefined) {
              input.qualification = qualifications;
            }

            const result = validateUpdateClinician(input);

            // Verify specialization array
            expect(Array.isArray(result.specialization)).toBe(true);
            expect(result.specialization).toHaveLength(specializations.length);

            // Verify qualification array if provided
            if (qualifications !== undefined) {
              expect(Array.isArray(result.qualification)).toBe(true);
              expect(result.qualification).toHaveLength(qualifications.length);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should reject empty specialization arrays", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (userId, centreId) => {
            const input = {
              user_id: userId,
              primary_centre_id: centreId,
              specialization: [], // Empty array
            };

            expect(() => validateCreateClinician(input)).toThrow();
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should reject non-array specialization values", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.object(),
          ),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (invalidSpec, userId, centreId) => {
            // Skip if it happens to be a valid array
            if (Array.isArray(invalidSpec) && invalidSpec.length > 0) {
              return;
            }

            const input = {
              user_id: userId,
              primary_centre_id: centreId,
              specialization: invalidSpec,
            };

            expect(() => validateCreateClinician(input)).toThrow();
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
