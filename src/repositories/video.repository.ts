// src/repositories/video.repository.ts
import { db } from "../config/db";

interface StoreMeetLinkData {
  appointment_id: number;
  meet_link: string;
  calendar_event_id?: string;
  provider: string;
}

export class VideoRepository {
  /**
   * Store Meet link to save Meet link with appointment
   */
  async storeMeetLink(data: StoreMeetLinkData) {
    const query = `
      INSERT INTO appointment_video_links (
        appointment_id,
        meet_link,
        calendar_event_id,
        provider,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (appointment_id)
      DO UPDATE SET
        meet_link = EXCLUDED.meet_link,
        calendar_event_id = EXCLUDED.calendar_event_id,
        updated_at = NOW()
      RETURNING *;
    `;

    return db.one(query, [
      data.appointment_id,
      data.meet_link,
      data.calendar_event_id || null,
      data.provider,
    ]);
  }

  /**
   * Get Meet link by appointment to retrieve stored link
   */
  async getMeetLinkByAppointment(appointmentId: number) {
    const query = `
      SELECT *
      FROM appointment_video_links
      WHERE appointment_id = $1
    `;

    return db.oneOrNone(query, [appointmentId]);
  }

  /**
   * Get Meet link by calendar event ID
   */
  async getMeetLinkByEventId(eventId: string) {
    const query = `
      SELECT *
      FROM appointment_video_links
      WHERE calendar_event_id = $1
    `;

    return db.oneOrNone(query, [eventId]);
  }

  /**
   * Update Meet link
   */
  async updateMeetLink(
    appointmentId: number,
    meetLink: string,
    eventId?: string
  ) {
    const query = `
      UPDATE appointment_video_links
      SET meet_link = $1,
          calendar_event_id = $2,
          updated_at = NOW()
      WHERE appointment_id = $3
      RETURNING *;
    `;

    return db.one(query, [meetLink, eventId || null, appointmentId]);
  }

  /**
   * Delete Meet link
   */
  async deleteMeetLink(appointmentId: number) {
    const query = `
      DELETE FROM appointment_video_links
      WHERE appointment_id = $1
      RETURNING *;
    `;

    return db.oneOrNone(query, [appointmentId]);
  }

  /**
   * Get all video links with appointment details
   */
  async getAllVideoLinks(filters?: {
    startDate?: string;
    endDate?: string;
    provider?: string;
  }) {
    const conditions: string[] = ["1=1"];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.startDate) {
      conditions.push(`avl.created_at >= $${paramIndex}`);
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters?.endDate) {
      conditions.push(`avl.created_at <= $${paramIndex}`);
      params.push(filters.endDate);
      paramIndex++;
    }

    if (filters?.provider) {
      conditions.push(`avl.provider = $${paramIndex}`);
      params.push(filters.provider);
      paramIndex++;
    }

    const query = `
      SELECT
        avl.*,
        a.scheduled_start_at,
        a.scheduled_end_at,
        a.status as appointment_status,
        u_patient.full_name as patient_name,
        u_clinician.full_name as clinician_name
      FROM appointment_video_links avl
      JOIN appointments a ON avl.appointment_id = a.id
      JOIN users u_patient ON a.patient_id = u_patient.id
      JOIN clinician_profiles cp ON a.clinician_id = cp.id
      JOIN users u_clinician ON cp.user_id = u_clinician.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY a.scheduled_start_at DESC
    `;

    return db.any(query, params);
  }
}

export const videoRepository = new VideoRepository();
