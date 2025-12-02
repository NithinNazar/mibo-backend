// src/repositories/video.repository.ts
import { db } from "../config/db";

export type VideoSessionStatus =
  | "SCHEDULED"
  | "STARTED"
  | "ENDED"
  | "CANCELLED";

export interface VideoSession {
  id: number;
  appointment_id: number;
  provider: string;
  meeting_id: string | null;
  join_url: string | null;
  host_url: string | null;
  status: VideoSessionStatus;
  scheduled_start_at: Date | null;
  scheduled_end_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class VideoRepository {
  async createSession(params: {
    appointment_id: number;
    meeting_id: string | null;
    join_url: string | null;
    host_url: string | null;
    status: VideoSessionStatus;
    scheduled_start_at: Date | null;
    scheduled_end_at: Date | null;
  }): Promise<VideoSession> {
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
      VALUES ($1, 'GOOGLE_MEET', $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;

    const session = await db.one<VideoSession>(query, [
      params.appointment_id,
      params.meeting_id,
      params.join_url,
      params.host_url,
      params.status,
      params.scheduled_start_at,
      params.scheduled_end_at,
    ]);

    return session;
  }

  async getByAppointmentId(
    appointmentId: number
  ): Promise<VideoSession | null> {
    const query = `
      SELECT *
      FROM video_sessions
      WHERE appointment_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    const session = await db.oneOrNone<VideoSession>(query, [appointmentId]);
    return session;
  }

  async updateStatus(
    id: number,
    status: VideoSessionStatus
  ): Promise<VideoSession> {
    const query = `
      UPDATE video_sessions
      SET status = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const session = await db.one<VideoSession>(query, [status, id]);
    return session;
  }
}

export const videoRepository = new VideoRepository();
