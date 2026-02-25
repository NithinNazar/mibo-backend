// src/repositories/video.repository.ts
import { db } from "../config/db";

interface StoreMeetLinkData {
  appointment_id: number;
  join_url: string;
  host_url?: string;
  meeting_id?: string;
  provider: string;
  status?: string;
  scheduled_start_at?: Date;
  scheduled_end_at?: Date;
}

export class VideoRepository {
  /**
   * Store Meet link to save Meet link with appointment
   */
  async storeMeetLink(data: StoreMeetLinkData) {
    const query = `
      INSERT INTO video_sessions (
        appointment_id,
        provider,
        meeting_id,
        join_url,
        host_url,
        status,
        scheduled_start_at,
        scheduled_end_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (appointment_id)
      DO UPDATE SET
        join_url = EXCLUDED.join_url,
        host_url = EXCLUDED.host_url,
        meeting_id = EXCLUDED.meeting_id,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING *;
    `;

    return db.one(query, [
      data.appointment_id,
      data.provider,
      data.meeting_id || null,
      data.join_url,
      data.host_url || null,
      data.status || "SCHEDULED",
      data.scheduled_start_at || null,
      data.scheduled_end_at || null,
    ]);
  }

  /**
   * Get Meet link by appointment to retrieve stored link
   */
  async getMeetLinkByAppointment(appointmentId: number) {
    const query = `
      SELECT *
      FROM video_sessions
      WHERE appointment_id = $1
    `;

    return db.oneOrNone(query, [appointmentId]);
  }

  /**
   * Get Meet link by meeting ID
   */
  async getMeetLinkByMeetingId(meetingId: string) {
    const query = `
      SELECT *
      FROM video_sessions
      WHERE meeting_id = $1
    `;

    return db.oneOrNone(query, [meetingId]);
  }

  /**
   * Update Meet link
   */
  async updateMeetLink(
    appointmentId: number,
    joinUrl: string,
    hostUrl?: string,
    meetingId?: string,
  ) {
    const query = `
      UPDATE video_sessions
      SET join_url = $1,
          host_url = $2,
          meeting_id = $3,
          updated_at = NOW()
      WHERE appointment_id = $4
      RETURNING *;
    `;

    return db.one(query, [
      joinUrl,
      hostUrl || null,
      meetingId || null,
      appointmentId,
    ]);
  }

  /**
   * Delete Meet link
   */
  async deleteMeetLink(appointmentId: number) {
    const query = `
      DELETE FROM video_sessions
      WHERE appointment_id = $1
      RETURNING *;
    `;

    return db.oneOrNone(query, [appointmentId]);
  }

  /**
   * Update video session status
   */
  async updateVideoSessionStatus(appointmentId: number, status: string) {
    const query = `
      UPDATE video_sessions
      SET status = $1,
          updated_at = NOW()
      WHERE appointment_id = $2
      RETURNING *;
    `;

    return db.one(query, [status, appointmentId]);
  }

  /**
   * Get all video links with appointment details
   */
  async getAllVideoLinks(filters?: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    status?: string;
  }) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.startDate) {
      conditions.push(`vs.created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`vs.created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.provider) {
      conditions.push(`vs.provider = $${paramIndex}`);
      params.push(filters.provider);
      paramIndex++;
    }

    if (filters?.status) {
      conditions.push(`vs.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    const query = `
      SELECT
        vs.*,
        a.scheduled_start_at as appointment_start,
        a.scheduled_end_at as appointment_end,
        a.status as appointment_status,
        u_patient.full_name as patient_name,
        u_clinician.full_name as clinician_name
      FROM video_sessions vs
      JOIN appointments a ON vs.appointment_id = a.id
      JOIN users u_patient ON a.patient_id = u_patient.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY vs.scheduled_start_at DESC
    `;

    return db.any(query, params);
  }
}

export const videoRepository = new VideoRepository();
