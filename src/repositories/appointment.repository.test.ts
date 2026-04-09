// src/repositories/appointment.repository.test.ts
import { AppointmentRepository } from "./appointment.repository";
import { db } from "../config/db";
import { AppointmentStatus } from "../types/appointment.types";

// Mock the database
jest.mock("../config/db", () => ({
  db: {
    any: jest.fn(),
    one: jest.fn(),
    oneOrNone: jest.fn(),
    none: jest.fn(),
  },
}));

describe("AppointmentRepository", () => {
  let repository: AppointmentRepository;
  const mockDb = db as jest.Mocked<typeof db>;

  beforeEach(() => {
    repository = new AppointmentRepository();
    jest.clearAllMocks();
  });

  describe("findAppointmentsByClinicianId", () => {
    const clinicianId = 1;
    const mockAppointments = [
      {
        id: 1,
        patient_id: 10,
        clinician_id: 1,
        centre_id: 5,
        appointment_type: "IN_PERSON",
        scheduled_start_at: new Date("2024-12-20T10:00:00Z"),
        scheduled_end_at: new Date("2024-12-20T10:30:00Z"),
        duration_minutes: 30,
        status: "BOOKED" as AppointmentStatus,
        parent_appointment_id: null,
        booked_by_user_id: 100,
        source: "WEB_PATIENT",
        notes: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        patient_name: "John Doe",
        patient_phone: "+919876543210",
        patient_email: "john@example.com",
        clinician_name: "Dr. Smith",
        centre_name: "Main Clinic",
        centre_city: "Mumbai",
      },
      {
        id: 2,
        patient_id: 11,
        clinician_id: 1,
        centre_id: 5,
        appointment_type: "ONLINE",
        scheduled_start_at: new Date("2024-12-21T14:00:00Z"),
        scheduled_end_at: new Date("2024-12-21T14:30:00Z"),
        duration_minutes: 30,
        status: "CONFIRMED" as AppointmentStatus,
        parent_appointment_id: null,
        booked_by_user_id: 101,
        source: "ADMIN_FRONT_DESK",
        notes: "Follow-up appointment",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        patient_name: "Jane Smith",
        patient_phone: "+919876543211",
        patient_email: "jane@example.com",
        clinician_name: "Dr. Smith",
        centre_name: "Main Clinic",
        centre_city: "Mumbai",
      },
    ];

    it("should return upcoming appointments for a clinician without filters", async () => {
      mockDb.any.mockResolvedValue(mockAppointments);

      const result =
        await repository.findAppointmentsByClinicianId(clinicianId);

      expect(result).toEqual(mockAppointments);
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("a.clinician_id = $1"),
        [clinicianId],
      );
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("a.scheduled_start_at >= NOW()"),
        expect.any(Array),
      );
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY a.scheduled_start_at ASC"),
        expect.any(Array),
      );
    });

    it("should filter by status when provided", async () => {
      const statusFilter: AppointmentStatus[] = ["BOOKED", "CONFIRMED"];
      mockDb.any.mockResolvedValue([mockAppointments[0]]);

      const result = await repository.findAppointmentsByClinicianId(
        clinicianId,
        { status: statusFilter },
      );

      expect(result).toEqual([mockAppointments[0]]);
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("a.status = ANY($2::text[])"),
        [clinicianId, statusFilter],
      );
    });

    it("should filter by date range when provided", async () => {
      const startDate = "2024-12-20";
      const endDate = "2024-12-25";
      mockDb.any.mockResolvedValue(mockAppointments);

      const result = await repository.findAppointmentsByClinicianId(
        clinicianId,
        { startDate, endDate },
      );

      expect(result).toEqual(mockAppointments);
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("DATE(a.scheduled_start_at) >= $2"),
        expect.arrayContaining([clinicianId, startDate, endDate]),
      );
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("DATE(a.scheduled_start_at) <= $3"),
        expect.arrayContaining([clinicianId, startDate, endDate]),
      );
    });

    it("should include patient details in results", async () => {
      mockDb.any.mockResolvedValue(mockAppointments);

      const result =
        await repository.findAppointmentsByClinicianId(clinicianId);

      expect(result[0]).toHaveProperty("patient_name");
      expect(result[0]).toHaveProperty("patient_phone");
      expect(result[0]).toHaveProperty("patient_email");
    });

    it("should include centre info in results", async () => {
      mockDb.any.mockResolvedValue(mockAppointments);

      const result =
        await repository.findAppointmentsByClinicianId(clinicianId);

      expect(result[0]).toHaveProperty("centre_name");
      expect(result[0]).toHaveProperty("centre_city");
    });

    it("should include clinician name in results", async () => {
      mockDb.any.mockResolvedValue(mockAppointments);

      const result =
        await repository.findAppointmentsByClinicianId(clinicianId);

      expect(result[0]).toHaveProperty("clinician_name");
      expect(result[0].clinician_name).toBe("Dr. Smith");
    });

    it("should return empty array when no appointments found", async () => {
      mockDb.any.mockResolvedValue([]);

      const result =
        await repository.findAppointmentsByClinicianId(clinicianId);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should apply all filters together", async () => {
      const filters = {
        status: ["BOOKED"] as AppointmentStatus[],
        startDate: "2024-12-20",
        endDate: "2024-12-25",
      };
      mockDb.any.mockResolvedValue([mockAppointments[0]]);

      const result = await repository.findAppointmentsByClinicianId(
        clinicianId,
        filters,
      );

      expect(result).toEqual([mockAppointments[0]]);
      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("a.clinician_id = $1"),
        expect.arrayContaining([
          clinicianId,
          filters.status,
          filters.startDate,
          filters.endDate,
        ]),
      );
    });

    it("should only return active appointments", async () => {
      mockDb.any.mockResolvedValue(mockAppointments);

      await repository.findAppointmentsByClinicianId(clinicianId);

      expect(mockDb.any).toHaveBeenCalledWith(
        expect.stringContaining("a.is_active = TRUE"),
        expect.any(Array),
      );
    });
  });
});
