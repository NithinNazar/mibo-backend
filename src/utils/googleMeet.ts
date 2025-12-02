// src/utils/googleMeet.ts
import { google } from "googleapis";
import { ENV } from "../config/env";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getJwtClient() {
  if (!ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL || !ENV.GOOGLE_PRIVATE_KEY) {
    throw new Error("Google service account credentials are not configured");
  }

  const jwt = new google.auth.JWT({
    email: ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: ENV.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  return jwt;
}

export interface CreateMeetParams {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  calendarId?: string;
}

export interface MeetDetails {
  eventId: string;
  hangoutLink: string | null;
}

/*
 Creates a Google Calendar event with Google Meet link.
*/
export async function createGoogleMeetEvent(
  params: CreateMeetParams
): Promise<MeetDetails> {
  const auth = getJwtClient();
  const calendar = google.calendar({ version: "v3", auth });

  const calendarId = params.calendarId || ENV.GOOGLE_CALENDAR_ID || "primary";

  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description || "",
      start: {
        dateTime: params.start.toISOString(),
      },
      end: {
        dateTime: params.end.toISOString(),
      },
      conferenceData: {
        createRequest: {
          requestId: `mibo-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    },
    conferenceDataVersion: 1,
  });

  const eventData = event.data;
  const hangoutLink = eventData.hangoutLink || null;

  return {
    eventId: eventData.id || "",
    hangoutLink,
  };
}

/*
 Cancels an existing event if needed.
*/
export async function cancelGoogleMeetEvent(
  eventId: string,
  calendarId?: string
) {
  const auth = getJwtClient();
  const calendar = google.calendar({ version: "v3", auth });

  const calId = calendarId || ENV.GOOGLE_CALENDAR_ID || "primary";

  await calendar.events.delete({
    calendarId: calId,
    eventId,
  });
}
