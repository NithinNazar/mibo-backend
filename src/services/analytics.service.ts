// src/services/analytics.service.ts
import { analyticsRepository } from "../repositories/analytics.repository";

interface DashboardMetrics {
  totalPatients: number;
  totalPatientsChange: number;
  activeDoctors: number;
  activeDoctorsChange: number;
  followUpsBooked: number;
  followUpsBookedChange: number;
  totalRevenue: number;
  totalRevenueChange: number;
}

interface TopDoctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string | null;
  patientCount: number;
}

interface RevenueDataPoint {
  date: string;
  value: number;
}

interface LeadSource {
  label: string;
  value: number;
  color: string;
}

export class AnalyticsService {
  /**
   * Get dashboard metrics with centre filtering based on user role
   */
  async getDashboardMetrics(
    userId: number,
    roles: string[]
  ): Promise<DashboardMetrics> {
    // Determine centre filter based on role
    let centreId: number | undefined;

    // ADMIN and MANAGER see all centres
    if (!roles.includes("ADMIN") && !roles.includes("MANAGER")) {
      // For other roles, we would need to get their assigned centre
      // For now, we'll return all data
      // TODO: Implement centre filtering for CENTRE_MANAGER, etc.
      centreId = undefined;
    }

    // Fetch all metrics in parallel
    const [patients, doctors, followUps, revenue] = await Promise.all([
      analyticsRepository.getTotalPatients(centreId),
      analyticsRepository.getActiveDoctors(centreId),
      analyticsRepository.getFollowUpsBooked(centreId),
      analyticsRepository.getTotalRevenue(centreId),
    ]);

    return {
      totalPatients: patients.current,
      totalPatientsChange: patients.change,
      activeDoctors: doctors.current,
      activeDoctorsChange: doctors.change,
      followUpsBooked: followUps.current,
      followUpsBookedChange: followUps.change,
      totalRevenue: revenue.current,
      totalRevenueChange: revenue.change,
    };
  }

  /**
   * Get top performing doctors
   */
  async getTopDoctors(
    limit: number = 10,
    centreId?: number
  ): Promise<TopDoctor[]> {
    return analyticsRepository.getTopDoctors(limit, centreId);
  }

  /**
   * Get revenue data for specified period
   */
  async getRevenueData(
    period: "week" | "month" | "year",
    centreId?: number
  ): Promise<RevenueDataPoint[]> {
    return analyticsRepository.getRevenueByPeriod(period, centreId);
  }

  /**
   * Get appointment leads by source
   */
  async getLeadsBySource(centreId?: number): Promise<LeadSource[]> {
    return analyticsRepository.getAppointmentsBySource(centreId);
  }
}

export const analyticsService = new AnalyticsService();
