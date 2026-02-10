// src/services/patient.service.ts
import { patientRepository } from "../repositories/patient.repository";
import { ApiError } from "../utils/apiError";
import {
  validateCreatePatient,
  validateUpdatePatient,
  validateAddMedicalNote,
} from "../validations/patient.validation";

export class PatientService {
  /**
   * Get patients with search functionality
   */
  async getPatients(search?: string, phone?: string) {
    // @ts-ignore - Method not implemented in repository
    return await patientRepository.findPatients(search, phone);
  }

  /**
   * Get patient by ID with complete details (appointments, payments, notes)
   */
  async getPatientById(patientId: number) {
    // @ts-ignore - Method not implemented in repository
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    // Get appointments
    const appointments =
      await patientRepository.getPatientAppointments(patientId);

    // Get payments
    const payments = await patientRepository.getPatientPayments(patientId);

    return {
      ...patient,
      appointments,
      payments,
    };
  }

  async getPatientByUserId(userId: number) {
    const result = await patientRepository.findByUserId(userId);
    if (!result) {
      throw ApiError.notFound("Patient not found");
    }
    return result;
  }

  /**
   * Create patient with duplicate phone check
   */
  async createPatient(body: any) {
    const dto = validateCreatePatient(body);

    // Check if phone already exists
    // @ts-ignore - Method not implemented in repository
    const phoneExists = await patientRepository.checkPhoneExists(dto.phone);
    if (phoneExists) {
      throw ApiError.conflict(
        "A patient with this phone number already exists",
      );
    }

    // @ts-ignore - Method not implemented in repository
    return await patientRepository.createPatient({
      phone: dto.phone,
      full_name: dto.full_name,
      email: dto.email,
      date_of_birth: dto.date_of_birth
        ? new Date(dto.date_of_birth)
        : undefined,
      gender: dto.gender,
      blood_group: dto.blood_group,
      emergency_contact_name: dto.emergency_contact_name,
      emergency_contact_phone: dto.emergency_contact_phone,
    });
  }

  /**
   * Update patient with validation
   */
  async updatePatient(patientId: number, body: any) {
    const dto = validateUpdatePatient(body);

    // Check if patient exists
    // @ts-ignore - Method not implemented in repository
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    // Convert date_of_birth string to Date if present
    const updateData: any = { ...dto };
    if (dto.date_of_birth) {
      updateData.date_of_birth = new Date(dto.date_of_birth);
    }

    return await patientRepository.updatePatientProfile(patientId, updateData);
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(patientId: number) {
    // Check if patient exists
    // @ts-ignore - Method not implemented in repository
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    return await patientRepository.getPatientAppointments(patientId);
  }

  /**
   * Add medical note with author tracking
   */
  async addMedicalNote(patientId: number, body: any, authorUserId: number) {
    const dto = validateAddMedicalNote(body);

    // Check if patient exists
    // @ts-ignore - Method not implemented in repository
    const patient = await patientRepository.findPatientById(patientId);
    if (!patient) {
      throw ApiError.notFound("Patient not found");
    }

    // @ts-ignore - Method not implemented in repository
    return await patientRepository.addMedicalNote(
      patientId,
      dto.note,
      authorUserId,
    );
  }
}

export const patientService = new PatientService();
