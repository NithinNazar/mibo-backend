// src/services/notification.service.ts
import { sendTemplateMessage, sendTextMessage } from "../utils/gallabox";
import { notificationRepository } from "../repositories/notification.repository";
import { patientRepository } from "../repositories/patient.repository";
import { appointmentRepository } from "../repositories/appointment.repository";

export class NotificationService {
  /*
   Sends OTP message to user.
  */
  async sendOtp(phone: string, otp: string) {
    const message = `Your Mibo login OTP is ${otp}. Do not share it with anyone.`;

    const response = await sendTextMessage(phone, message);

    await notificationRepository.logNotification({
      user_id: null,
      phone,
      notification_type: "OTP",
      message,
      provider_message_id: response?.data?.messageId || null,
    });

    return response;
  }

  /*
   Sends appointment confirmation message on WhatsApp.
  */
  async sendAppointmentConfirmed(appointmentId: number) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) return;

    const patient = await patientRepository.findById(appt.patient_id);
    if (!patient) return;

    const phone = patient.user.phone;

    const date = new Date(appt.scheduled_start_at);
    const formatted = date.toLocaleString("en-IN");

    const message =
      `Your appointment is confirmed.\n` +
      `Doctor ID: ${appt.clinician_id}\n` +
      `Centre ID: ${appt.centre_id}\n` +
      `Date & Time: ${formatted}\n` +
      `Thank you for choosing Mibo.`;

    const response = await sendTextMessage(phone || "", message);

    await notificationRepository.logNotification({
      user_id: patient.user.id,
      phone: phone || "",
      notification_type: "APPOINTMENT_CONFIRMED",
      message,
      provider_message_id: response?.data?.messageId || null,
    });

    return response;
  }

  /*
   Sends rescheduled appointment notification.
  */
  async sendRescheduled(appointmentId: number) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) return;

    const patient = await patientRepository.findById(appt.patient_id);
    if (!patient) return;

    const phone = patient.user.phone;

    const date = new Date(appt.scheduled_start_at).toLocaleString("en-IN");

    const message =
      `Your appointment has been rescheduled.\n` +
      `New Time: ${date}\n` +
      `Doctor ID: ${appt.clinician_id}`;

    const response = await sendTextMessage(phone || "", message);

    await notificationRepository.logNotification({
      user_id: patient.user.id,
      phone: phone || "",
      notification_type: "APPOINTMENT_RESCHEDULED",
      message,
      provider_message_id: response?.data?.messageId || null,
    });

    return response;
  }

  /*
   Sends cancellation notification.
  */
  async sendCancelled(appointmentId: number, reason?: string) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) return;

    const patient = await patientRepository.findById(appt.patient_id);
    if (!patient) return;

    const phone = patient.user.phone;

    const message =
      `Your appointment has been cancelled.\n` +
      `Reason: ${reason || "Not specified"}.`;

    const response = await sendTextMessage(phone || "", message);

    await notificationRepository.logNotification({
      user_id: patient.user.id,
      phone: phone || "",
      notification_type: "APPOINTMENT_CANCELLED",
      message,
      provider_message_id: response?.data?.messageId || null,
    });

    return response;
  }

  /*
   Sends Google Meet link for online appointment.
  */
  async sendGoogleMeetLink(appointmentId: number, meetLink: string) {
    const appt = await appointmentRepository.getAppointmentById(appointmentId);
    if (!appt) return;

    const patient = await patientRepository.findById(appt.patient_id);
    if (!patient) return;

    const phone = patient.user.phone;

    const message =
      `Your online consultation is scheduled.\n` +
      `Join Google Meet: ${meetLink}\n` +
      `Please join on time.`;

    const response = await sendTextMessage(phone || "", message);

    await notificationRepository.logNotification({
      user_id: patient.user.id,
      phone: phone || "",
      notification_type: "ONLINE_MEET_LINK",
      message,
      provider_message_id: response?.data?.messageId || null,
    });

    return response;
  }
}

export const notificationService = new NotificationService();
