// src/services/centre.service.ts
import { centreRepository } from "../repositories/centre.repository";
import { ApiError } from "../utils/apiError";

interface CentreResponse {
  id: string;
  name: string;
  city: string;
  address: string;
  pincode: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CentreService {
  /**
   * Get all centres with optional city filter
   */
  async getCentres(city?: string): Promise<CentreResponse[]> {
    // Validate city if provided
    if (
      city &&
      !["bangalore", "kochi", "mumbai"].includes(city.toLowerCase())
    ) {
      throw ApiError.badRequest(
        "Invalid city. Must be bangalore, kochi, or mumbai"
      );
    }

    const centres = await centreRepository.findCentres(city?.toLowerCase());

    return centres.map((centre) => this.formatCentreResponse(centre));
  }

  /**
   * Get centre by ID
   */
  async getCentreById(id: number): Promise<CentreResponse> {
    const centre = await centreRepository.findCentreById(id);

    if (!centre) {
      throw ApiError.notFound("Centre not found");
    }

    return this.formatCentreResponse(centre);
  }

  /**
   * Create new centre
   */
  async createCentre(data: {
    name: string;
    city: string;
    addressLine1: string;
    addressLine2?: string;
    pincode: string;
    contactPhone: string;
  }): Promise<CentreResponse> {
    // Validate city
    const validCities = ["bangalore", "kochi", "mumbai"];
    if (!validCities.includes(data.city.toLowerCase())) {
      throw ApiError.badRequest("City must be bangalore, kochi, or mumbai");
    }

    const centre = await centreRepository.createCentre({
      ...data,
      city: data.city.toLowerCase(),
    });

    return this.formatCentreResponse(centre);
  }

  /**
   * Update centre
   */
  async updateCentre(
    id: number,
    data: {
      name?: string;
      city?: string;
      addressLine1?: string;
      addressLine2?: string;
      pincode?: string;
      contactPhone?: string;
    }
  ): Promise<CentreResponse> {
    // Check if centre exists
    const existing = await centreRepository.findCentreById(id);
    if (!existing) {
      throw ApiError.notFound("Centre not found");
    }

    // Validate city if provided
    if (data.city) {
      const validCities = ["bangalore", "kochi", "mumbai"];
      if (!validCities.includes(data.city.toLowerCase())) {
        throw ApiError.badRequest("City must be bangalore, kochi, or mumbai");
      }
      data.city = data.city.toLowerCase();
    }

    const centre = await centreRepository.updateCentre(id, data);

    return this.formatCentreResponse(centre);
  }

  /**
   * Delete centre
   */
  async deleteCentre(id: number): Promise<void> {
    // Check if centre exists
    const existing = await centreRepository.findCentreById(id);
    if (!existing) {
      throw ApiError.notFound("Centre not found");
    }

    // TODO: Check if centre has active appointments or staff
    // For now, just soft delete

    await centreRepository.deleteCentre(id);
  }

  /**
   * Format centre response
   */
  private formatCentreResponse(centre: any): CentreResponse {
    const address = [centre.address_line1, centre.address_line2]
      .filter(Boolean)
      .join(", ");

    return {
      id: centre.id.toString(),
      name: centre.name,
      city: centre.city,
      address,
      pincode: centre.pincode,
      phone: centre.contact_phone,
      isActive: centre.is_active,
      createdAt: centre.created_at,
      updatedAt: centre.updated_at,
    };
  }
}

export const centreService = new CentreService();
