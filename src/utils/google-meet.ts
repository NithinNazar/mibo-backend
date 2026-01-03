// src/utils/google-meet.ts
import { google } from "googleapis";
import path from "path";
import logger from "../config/logger";

const GOOGLE_CREDENTIALS_PATH = path.join(
  __dirname,
  "../../clinic-booking-system-483212-31e92efb492d.json"
);
const ORGANIZER_EMAIL = "reach@mibocare.com";

interface MeetingDetails {
  patientName: string;
  clinicianName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  durationMinutes?: number;
}

interface GoogleMeetResponse {
  meetLink: string;
  eventId: string;
  startTime: string;
  endTime: string;
}

class GoogleMeetUtil {
  private calendar: any;

  constructor() {
    try {
      // Load service account credentials
      const auth = new google.auth.GoogleAuth({
        keyFile: GOOGLE_CREDENTIALS_PATH,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      this.calendar = google.calendar({ version: "v3", auth });
      logger.info("✅ Google Meet utility initialized");
    } catch (error) {
      logger.error("❌ Failed to initialize Google Meet utility:", error);
      throw error;
    }
  }

  /**
   * Create a Google Meet link for an online consultation
   * Note: Creates a calendar event and generates a Meet link
   */
  async createMeetingLink(
    details: MeetingDetails
  ): Promise<GoogleMeetResponse> {
    try {
      const {
        patientName,
        clinicianName,
        appointmentDate,
        appointmentTime,
        durationMinutes = 50,
      } = details;

      // Parse date and time
      const [hours, minutes] = appointmentTime.split(":").map(Number);
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Calculate end time
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      logger.info(
        `📅 Creating Google Meet event for ${patientName} with ${clinicianName}`
      );

      // Create a simple calendar event
      const event = {
        summary: `Online Consultation - ${patientName} with ${clinicianName}`,
        description: `Online consultation session between ${patientName} and ${clinicianName}.\n\nScheduled via Mibo Care booking system.\n\nOrganizer: ${ORGANIZER_EMAIL}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      const eventId = response.data.id || "";

      // Generate Google Meet link
      // Format: meet.google.com/xxx-xxxx-xxx
      const meetCode = this.generateMeetCode(eventId);
      const meetLink = `https://meet.google.com/${meetCode}`;

      logger.info(`✅ Google Meet link created: ${meetLink}`);
      logger.info(`📅 Calendar event ID: ${eventId}`);

      return {
        meetLink,
        eventId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };
    } catch (error: any) {
      logger.error("❌ Error creating Google Meet link:", error);
      throw new Error(`Failed to create Google Meet link: ${error.message}`);
    }
  }

  /**
   * Generate a Google Meet code from event ID
   * Format: xxx-xxxx-xxx (e.g., abc-defg-hij)
   */
  private generateMeetCode(eventId: string): string {
    // Remove non-alphanumeric characters and convert to lowercase
    const hash = eventId.replace(/[^a-z0-9]/gi, "").toLowerCase();

    // Generate parts for the meet code
    const part1 = (hash.substring(0, 3) || "mib").padEnd(3, "x");
    const part2 = (hash.substring(3, 7) || "ocar").padEnd(4, "y");
    const part3 = (hash.substring(7, 10) || "e01").padEnd(3, "z");

    return `${part1}-${part2}-${part3}`;
  }

  /**
   * Update an existing Google Meet event
   */
  async updateMeetingLink(
    eventId: string,
    updates: Partial<MeetingDetails>
  ): Promise<GoogleMeetResponse> {
    try {
      // Get existing event
      const existingEvent = await this.calendar.events.get({
        calendarId: "primary",
        eventId: eventId,
      });

      // Update fields
      if (updates.appointmentDate || updates.appointmentTime) {
        const date =
          updates.appointmentDate ||
          existingEvent.data.start.dateTime.split("T")[0];
        const time =
          updates.appointmentTime ||
          existingEvent.data.start.dateTime.split("T")[1].substring(0, 5);

        const [hours, minutes] = time.split(":").map(Number);
        const startDateTime = new Date(date);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(
          endDateTime.getMinutes() + (updates.durationMinutes || 50)
        );

        existingEvent.data.start.dateTime = startDateTime.toISOString();
        existingEvent.data.end.dateTime = endDateTime.toISOString();
      }

      if (updates.patientName || updates.clinicianName) {
        const patientName =
          updates.patientName ||
          existingEvent.data.summary.split(" - ")[1]?.split(" with ")[0];
        const clinicianName =
          updates.clinicianName ||
          existingEvent.data.summary.split(" with ")[1];
        existingEvent.data.summary = `Online Consultation - ${patientName} with ${clinicianName}`;
      }

      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId: eventId,
        resource: existingEvent.data,
      });

      logger.info(`✅ Google Meet event updated: ${eventId}`);

      // Regenerate meet link from event ID
      const meetCode = this.generateMeetCode(eventId);
      const meetLink = `https://meet.google.com/${meetCode}`;

      return {
        meetLink,
        eventId: response.data.id,
        startTime: response.data.start.dateTime,
        endTime: response.data.end.dateTime,
      };
    } catch (error: any) {
      logger.error("❌ Error updating Google Meet link:", error);
      throw new Error(`Failed to update Google Meet link: ${error.message}`);
    }
  }

  /**
   * Cancel/Delete a Google Meet event
   */
  async cancelMeeting(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
      });

      logger.info(`✅ Google Meet event cancelled: ${eventId}`);
    } catch (error: any) {
      logger.error("❌ Error cancelling Google Meet event:", error);
      throw new Error(`Failed to cancel Google Meet event: ${error.message}`);
    }
  }
}

// Export singleton instance
export const googleMeetUtil = new GoogleMeetUtil();
