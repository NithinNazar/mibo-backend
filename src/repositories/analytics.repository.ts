// src/repositories/analytics.repository.ts
import { db } from "../config/db";

interface MetricWithChange {
  current: number;
  previous: number;
  change: number;
}

export class AnalyticsRepository {
  /**
   * Get total patients count with comparison to previous period
   */
  async getTotalPatients(centreId?: number): Promise<MetricWithChange> {
    const centreFilter = centreId ? "AND pp.centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    // Current month
    const currentQuery = `
      SELECT COUNT(DISTINCT pp.id) as count
      FROM patient_profiles pp
      WHERE pp.is_active = TRUE
        AND pp.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    // Previous month
    const previousQuery = `
      SELECT COUNT(DISTINCT pp.id) as count
      FROM patient_profiles pp
      WHERE pp.is_active = TRUE
        AND pp.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND pp.created_at < DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    const current = await db.one<{ count: string }>(currentQuery, params);
    const previous = await db.one<{ count: string }>(previousQuery, params);

    const currentCount = parseInt(current.count);
    const previousCount = parseInt(previous.count);
    const change =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0;

    return {
      current: currentCount,
      previous: previousCount,
      change: Math.round(change * 10) / 10,
    };
  }

  /**
   * Get active doctors count with comparison
   */
  async getActiveDoctors(centreId?: number): Promise<MetricWithChange> {
    const centreFilter = centreId ? "AND cp.primary_centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    const currentQuery = `
      SELECT COUNT(DISTINCT cp.id) as count
      FROM clinician_profiles cp
      WHERE cp.is_active = TRUE
        ${centreFilter}
    `;

    // For doctors, we compare with last month's active count
    const previousQuery = `
      SELECT COUNT(DISTINCT cp.id) as count
      FROM clinician_profiles cp
      WHERE cp.is_active = TRUE
        AND cp.created_at < DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    const current = await db.one<{ count: string }>(currentQuery, params);
    const previous = await db.one<{ count: string }>(previousQuery, params);

    const currentCount = parseInt(current.count);
    const previousCount = parseInt(previous.count);
    const change =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0;

    return {
      current: currentCount,
      previous: previousCount,
      change: Math.round(change * 10) / 10,
    };
  }

  /**
   * Get follow-ups booked count with comparison
   */
  async getFollowUpsBooked(centreId?: number): Promise<MetricWithChange> {
    const centreFilter = centreId ? "AND a.centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    // Current month
    const currentQuery = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.appointment_type = 'FOLLOW_UP'
        AND a.status IN ('BOOKED', 'CONFIRMED')
        AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    // Previous month
    const previousQuery = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE a.appointment_type = 'FOLLOW_UP'
        AND a.status IN ('BOOKED', 'CONFIRMED')
        AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND a.created_at < DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    const current = await db.one<{ count: string }>(currentQuery, params);
    const previous = await db.one<{ count: string }>(previousQuery, params);

    const currentCount = parseInt(current.count);
    const previousCount = parseInt(previous.count);
    const change =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0;

    return {
      current: currentCount,
      previous: previousCount,
      change: Math.round(change * 10) / 10,
    };
  }

  /**
   * Get total revenue with comparison
   */
  async getTotalRevenue(centreId?: number): Promise<MetricWithChange> {
    const centreFilter = centreId ? "AND a.centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    // Current month
    const currentQuery = `
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.status = 'SUCCESS'
        AND p.paid_at >= DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    // Previous month
    const previousQuery = `
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.status = 'SUCCESS'
        AND p.paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND p.paid_at < DATE_TRUNC('month', CURRENT_DATE)
        ${centreFilter}
    `;

    const current = await db.one<{ total: string }>(currentQuery, params);
    const previous = await db.one<{ total: string }>(previousQuery, params);

    const currentTotal = parseFloat(current.total);
    const previousTotal = parseFloat(previous.total);
    const change =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : 0;

    return {
      current: currentTotal,
      previous: previousTotal,
      change: Math.round(change * 10) / 10,
    };
  }

  /**
   * Get top performing doctors
   */
  async getTopDoctors(limit: number = 10, centreId?: number) {
    const centreFilter = centreId ? "AND cp.primary_centre_id = $2" : "";
    const params = centreId ? [limit, centreId] : [limit];

    const query = `
      SELECT
        cp.id,
        u.full_name as name,
        cp.specialization as specialty,
        sp.profile_picture_url as avatar,
        COUNT(a.id) as patient_count
      FROM clinician_profiles cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN staff_profiles sp ON u.id = sp.user_id
      LEFT JOIN appointments a ON cp.id = a.clinician_id
        AND a.status = 'COMPLETED'
        AND a.scheduled_start_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE cp.is_active = TRUE
        ${centreFilter}
      GROUP BY cp.id, u.full_name, cp.specialization, sp.profile_picture_url
      ORDER BY patient_count DESC
      LIMIT $1
    `;

    const doctors = await db.any<{
      id: number;
      name: string;
      specialty: string;
      avatar: string | null;
      patient_count: string;
    }>(query, params);

    return doctors.map((doc) => ({
      id: doc.id.toString(),
      name: doc.name,
      specialty: doc.specialty,
      avatar: doc.avatar,
      patientCount: parseInt(doc.patient_count),
    }));
  }

  /**
   * Get revenue data by period
   */
  async getRevenueByPeriod(
    period: "week" | "month" | "year",
    centreId?: number
  ) {
    const centreFilter = centreId ? "AND a.centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    let interval: string;
    let dateFormat: string;

    switch (period) {
      case "week":
        interval = "7 days";
        dateFormat = "day";
        break;
      case "month":
        interval = "30 days";
        dateFormat = "day";
        break;
      case "year":
        interval = "12 months";
        dateFormat = "month";
        break;
    }

    const query = `
      SELECT
        DATE_TRUNC('${dateFormat}', p.paid_at) as date,
        SUM(p.amount) as value
      FROM payments p
      JOIN appointments a ON p.appointment_id = a.id
      WHERE p.status = 'SUCCESS'
        AND p.paid_at >= CURRENT_DATE - INTERVAL '${interval}'
        ${centreFilter}
      GROUP BY DATE_TRUNC('${dateFormat}', p.paid_at)
      ORDER BY date ASC
    `;

    const data = await db.any<{ date: Date; value: string }>(query, params);

    return data.map((item) => ({
      date: item.date.toISOString().split("T")[0],
      value: parseFloat(item.value),
    }));
  }

  /**
   * Get appointments by source
   */
  async getAppointmentsBySource(centreId?: number) {
    const centreFilter = centreId ? "AND centre_id = $1" : "";
    const params = centreId ? [centreId] : [];

    const query = `
      SELECT
        source,
        COUNT(*) as count
      FROM appointments
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ${centreFilter}
      GROUP BY source
    `;

    const data = await db.any<{ source: string; count: string }>(query, params);

    // Map source to labels and colors
    const sourceMap: Record<string, { label: string; color: string }> = {
      WEB_PATIENT: { label: "Website", color: "#3b82f6" },
      ADMIN_FRONT_DESK: { label: "Phone", color: "#10b981" },
      ADMIN_CARE_COORDINATOR: { label: "Direct", color: "#f59e0b" },
      ADMIN_MANAGER: { label: "Referrals", color: "#8b5cf6" },
    };

    return data.map((item) => ({
      label: sourceMap[item.source]?.label || item.source,
      value: parseInt(item.count),
      color: sourceMap[item.source]?.color || "#6b7280",
    }));
  }
}

export const analyticsRepository = new AnalyticsRepository();
