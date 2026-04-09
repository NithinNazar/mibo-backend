import { AppointmentService } from "../appointment.services";
import { appointmentRepository } from "../../repositories/appointment.repository";
import { patientRepository } from "../../repositories/patient.repository";
import { ApiError } from "../../utils/apiError";
import { JwtPayload } from "../../utils/jwt";

// Mock the repositories
jest.mock("../../repositories/appointment.repository");
jest.mock("../../repositories/patient.repository");

describe("AppointmentService - getAppointments", () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService();
    jest.clearAllMocks();
  });

  describe("Clinician Role-Based Filtering", () => {
    it("should call findAppointmentsByClinicianId when user is a CLINICIAN", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };

      const mockAppointments = [
        {
          id: 1,
          patient_name: "John Doe",
          scheduled_start_at: new Date("2024-01-15T10:00:00Z"),
          status: "SCHEDULED",
        },
      ];

      (
        appointmentRepository.findAppointmentsByClinicianId as jest.Mock
      ).mockResolvedValue(mockAppointments);

      // Act
      const result = await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(
        appointmentRepository.findAppointmentsByClinicianId,
      ).toHaveBeenCalledWith(5, {
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
      expect(result).toEqual(mockAppointments);
    });

    it("should throw error when clinician ID is missing from token", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        // clinicianId is missing
      };

      // Act & Assert
      await expect(
        appointmentService.getAppointments({}, authUser),
      ).rejects.toThrow(ApiError.forbidden("Clinician ID not found in token"));

      expect(
        appointmentRepository.findAppointmentsByClinicianId,
      ).not.toHaveBeenCalled();
    });

    it("should pass filters to findAppointmentsByClinicianId", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN"],
        clinicianId: 5,
      };

      const filters = {
        status: "SCHEDULED" as any,
        date: "2024-01-15",
      };

      (
        appointmentRepository.findAppointmentsByClinicianId as jest.Mock
      ).mockResolvedValue([]);

      // Act
      await appointmentService.getAppointments(filters, authUser);

      // Assert
      expect(
        appointmentRepository.findAppointmentsByClinicianId,
      ).toHaveBeenCalledWith(5, {
        status: ["SCHEDULED"],
        startDate: "2024-01-15",
        endDate: "2024-01-15",
      });
    });

    it("should not filter by clinician when user has ADMIN role", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN", "ADMIN"],
        clinicianId: 5,
      };

      const mockAppointments = [
        { id: 1, patient_name: "John Doe" },
        { id: 2, patient_name: "Jane Smith" },
      ];

      (appointmentRepository.findAppointments as jest.Mock).mockResolvedValue(
        mockAppointments,
      );

      // Act
      const result = await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(appointmentRepository.findAppointments).toHaveBeenCalledWith({});
      expect(
        appointmentRepository.findAppointmentsByClinicianId,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });

    it("should not filter by clinician when user has MANAGER role", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["CLINICIAN", "MANAGER"],
        clinicianId: 5,
      };

      const mockAppointments = [
        { id: 1, patient_name: "John Doe" },
        { id: 2, patient_name: "Jane Smith" },
      ];

      (appointmentRepository.findAppointments as jest.Mock).mockResolvedValue(
        mockAppointments,
      );

      // Act
      const result = await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(appointmentRepository.findAppointments).toHaveBeenCalledWith({});
      expect(
        appointmentRepository.findAppointmentsByClinicianId,
      ).not.toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });
  });

  describe("Admin/Manager Role Access", () => {
    it("should return all appointments for ADMIN users", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["ADMIN"],
      };

      const mockAppointments = [
        { id: 1, clinician_id: 1, patient_name: "John Doe" },
        { id: 2, clinician_id: 2, patient_name: "Jane Smith" },
        { id: 3, clinician_id: 3, patient_name: "Bob Johnson" },
      ];

      (appointmentRepository.findAppointments as jest.Mock).mockResolvedValue(
        mockAppointments,
      );

      // Act
      const result = await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(appointmentRepository.findAppointments).toHaveBeenCalledWith({});
      expect(result).toEqual(mockAppointments);
      expect(result.length).toBe(3);
    });

    it("should return all appointments for MANAGER users", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "STAFF",
        roles: ["MANAGER"],
      };

      const mockAppointments = [
        { id: 1, clinician_id: 1, patient_name: "John Doe" },
        { id: 2, clinician_id: 2, patient_name: "Jane Smith" },
      ];

      (appointmentRepository.findAppointments as jest.Mock).mockResolvedValue(
        mockAppointments,
      );

      // Act
      const result = await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(appointmentRepository.findAppointments).toHaveBeenCalledWith({});
      expect(result).toEqual(mockAppointments);
    });
  });

  describe("Patient Role Access", () => {
    it("should filter appointments by patient ID for PATIENT users", async () => {
      // Arrange
      const authUser: JwtPayload = {
        userId: 1,
        phone: "+1234567890",
        userType: "PATIENT",
        roles: ["PATIENT"],
      };

      const mockPatient = {
        profile: { id: 10 },
      };

      (patientRepository.findByUserId as jest.Mock).mockResolvedValue(
        mockPatient,
      );
      (appointmentRepository.findAppointments as jest.Mock).mockResolvedValue(
        [],
      );

      // Act
      await appointmentService.getAppointments({}, authUser);

      // Assert
      expect(patientRepository.findByUserId).toHaveBeenCalledWith(1);
      expect(appointmentRepository.findAppointments).toHaveBeenCalledWith({
        patientId: 10,
      });
    });
  });
});
