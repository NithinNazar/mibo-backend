// src/middlewares/__tests__/role.middleware.test.ts
import { Request, Response, NextFunction } from "express";
import { requireRole, enforceClinicianScope } from "../role.middleware";
import { AuthRequest } from "../auth.middleware";
import { ApiError } from "../../utils/apiError";

describe("Role Middleware", () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      user: undefined,
      params: {},
      query: {},
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe("requireRole", () => {
    it("should call next() when user has required role", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
      };

      const middleware = requireRole("CLINICIAN");
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() when user has one of multiple allowed roles", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["ADMIN"],
      };

      const middleware = requireRole("ADMIN", "MANAGER");
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next with ApiError when user is not authenticated", () => {
      mockRequest.user = undefined;

      const middleware = requireRole("CLINICIAN");
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should call next with ApiError when user does not have required role", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["RECEPTIONIST"],
      };

      const middleware = requireRole("CLINICIAN");
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should handle empty roles array", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: [],
      };

      const middleware = requireRole("CLINICIAN");
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("enforceClinicianScope", () => {
    it("should call next() when user is not a clinician", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["ADMIN"],
      };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() when clinician has valid clinicianId and no requested ID", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() when clinician accesses their own data via params", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };
      mockRequest.params = { clinicianId: "5" };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() when clinician accesses their own data via query", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };
      mockRequest.query = { clinicianId: "5" };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next() when clinician accesses their own data via body", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };
      mockRequest.body = { clinician_id: 5 };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should call next with ApiError when user is not authenticated", () => {
      mockRequest.user = undefined;

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("Authentication required");
    });

    it("should call next with ApiError when clinician has no clinicianId in token", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        // clinicianId is missing
      };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("Clinician ID not found");
    });

    it("should call next with ApiError when clinician tries to access another clinician's data", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };
      mockRequest.params = { clinicianId: "10" }; // Different clinician ID

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain(
        "Access denied to other clinician's data",
      );
    });

    it("should call next with ApiError when clinicianId format is invalid", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };
      mockRequest.params = { clinicianId: "invalid" };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("Invalid clinician ID format");
    });

    it("should handle clinician with multiple roles including CLINICIAN", () => {
      mockRequest.user = {
        userId: 1,
        phone: "1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN", "RECEPTIONIST"],
        clinicianId: 5,
      };
      mockRequest.params = { clinicianId: "5" };

      const middleware = enforceClinicianScope();
      middleware(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
