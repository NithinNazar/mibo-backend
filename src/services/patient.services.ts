// src/services/patient.service.ts
import { patientRepository } from "../repositories/patient.repository";
import { ApiError } from "../utils/apiError";
import {
  validateCreatePatient,
  validateUpdatePatient,
} from "../validations/patient.validation";

export class PatientService {
  async getPatientByUserId(userId: number) {
    const result = await patientRepository.findByUserId(userId);
    if (!result) {
      throw ApiError.notFound("Patient not found");
    }
    return result;
  }

  async getPatientById(patientId: number) {
    const result = await patientRepository.findById(patientId);
    if (!result) {
      throw ApiError.notFound("Patient not found");
    }
    return result;
  }

  async updatePatient(userId: number, body: any) {
    const dto = validateUpdatePatient(body);
    return await patientRepository.updatePatient(userId, dto);
  }

  async createPatient(body: any) {
    const dto = validateCreatePatient(body);

    return await patientRepository.createPatient(
      dto.phone,
      dto.full_name || "Patient"
    );
  }
}

export const patientService = new PatientService();
