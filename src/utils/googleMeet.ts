// src/utils/googleMeet.ts
import { google } from "googleapis";
import { ENV } from "../config/env";
import logger from "../config/logger";

/**
 * Google Meet utility for video consultation links
 *
 * Setup Instructions:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable Google Calendar API
 * 4. Create a Service Account:
 *    - Go to IAM & Admin > Service Accounts
 *    - Create Service Account
 *    - Grant "Editor" role
 *    - Create and download JSON key
 * 5. Share your Google Calendar with the service account email
 * 6. Add credentials to .env:
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY (from JSON key file)
 *    - GOOGLE_CALENDAR_ID (usually "primary" or your calendar ID)
 */

class GoogleMeetUtil {
  private calendar: any = null;
  private isConfigured: boolean = false;

  constructor() {
    // Only initialize if credentials are provided
    if (
      ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      ENV.GOOGLE_PRIVATE_KEY &&
      ENV.GOOGLE_CALENDAR_ID
    ) {
      try {
        // Parse private key (handle escaped newlines)
        const privateKey = ENV.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

        // Create JWT client
        const auth = new google.auth.JWT({
          email: ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: privateKey,
          scopes: [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
          ],
          subject:"reach@mibocare.com"
        });

        // Initialize Calendar API
        this.calendar = google.calendar({ version: "v3", auth });
        this.isConfigured = true;

        logger.info("✓ Google Meet initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize Google Meet:", error);
      }
    } else {
      logger.warn(
        "⚠ Google Meet not configured. Add GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_CALENDAR_ID to enable video consultations."
      );
    }
  }

  /**
   * Check if Google Meet is configured
   */
  isReady(): boolean {
    return this.isConfigured && this.calendar !== null;
  }

  /**
   * Create calendar event with Google Meet enabled
   * @param summary Event title
   * @param description Event description
   * @param startTime Start time (ISO string)
   * @param endTime End time (ISO string)
   * @param attendees Array of attendee emails
   */
  async createCalendarEvent(
    summary: string,
    description: string,
    startTime: string,
    endTime: string,
    attendees: string[] = []
  ): Promise<any> {
    if (!this.isReady()) {
      throw new Error(
        "Google Meet is not configured. Please add credentials to environment variables."
      );
    }

    try {
      const event = {
        summary,
        description,
        start: {
          dateTime: startTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: ENV.GOOGLE_CALENDAR_ID,
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: "all",
      });

      logger.info(`Google Meet event created: ${response.data.id}`);

      return {
        eventId: response.data.id,
        meetLink:
          response.data.hangoutLink ||
          response.data.conferenceData?.entryPoints?.[0]?.uri,
        htmlLink: response.data.htmlLink,
        data: response.data,
      };
    } catch (error: any) {
      logger.error("Failed to create Google Meet event:", {
        error: error.message,
        details: error.response?.data,
      });
      throw new Error(`Failed to create Google Meet event: ${error.message}`);
    }
  }

  /**
   * Get event Meet link
   * @param eventId Google Calendar event ID
   */
  async getEventMeetLink(eventId: string): Promise<string | null> {
    if (!this.isReady()) {
      throw new Error("Google Meet is not configured");
    }

    try {
      const response = await this.calendar.events.get({
        calendarId: ENV.GOOGLE_CALENDAR_ID,
        eventId: eventId,
      });

      const meetLink =
        response.data.hangoutLink ||
        response.data.conferenceData?.entryPoints?.[0]?.uri;

      return meetLink || null;
    } catch (error: any) {
      logger.error(`Failed to get event ${eventId}:`, error);
      throw new Error(`Failed to get event: ${error.message}`);
    }
  }

  /**
   * Update calendar event
   * @param eventId Event ID to update
   * @param updates Event updates
   */
  async updateCalendarEvent(eventId: string, updates: any): Promise<any> {
    if (!this.isReady()) {
      throw new Error("Google Meet is not configured");
    }

    try {
      const response = await this.calendar.events.patch({
        calendarId: ENV.GOOGLE_CALENDAR_ID,
        eventId: eventId,
        resource: updates,
        sendUpdates: "all",
      });

      logger.info(`Google Meet event updated: ${eventId}`);

      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update event ${eventId}:`, error);
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  /**
   * Delete calendar event
   * @param eventId Event ID to delete
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error("Google Meet is not configured");
    }

    try {
      await this.calendar.events.delete({
        calendarId: ENV.GOOGLE_CALENDAR_ID,
        eventId: eventId,
        sendUpdates: "all",
      });

      logger.info(`Google Meet event deleted: ${eventId}`);
    } catch (error: any) {
      logger.error(`Failed to delete event ${eventId}:`, error);
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }

  /**
   * Create Meet link for appointment
   * Convenience method for appointment-specific events
   */
  async createMeetLinkForAppointment(
    patientName: string,
    clinicianName: string,
    patientEmail: string,
    startTime: string,
    endTime: string
  ): Promise<string> {
    const summary = `Consultation: ${patientName} with Dr. ${clinicianName}`;
    const description = `Online consultation session between ${patientName} and Dr. ${clinicianName}.\n\nPlease join the meeting 5 minutes before the scheduled time.`;

    const result = await this.createCalendarEvent(
      summary,
      description,
      startTime,
      endTime,
      patientEmail ? [patientEmail] : []
    );

    if (!result.meetLink) {
      throw new Error("Failed to generate Meet link");
    }

    return result.meetLink;
  }
}

// Export singleton instance
export const googleMeetUtil = new GoogleMeetUtil();
