// src/utils/gallabox.ts
import { gallaboxClient } from "../config/gallabox";

export interface SendWhatsAppMessageParams {
  phone: string;
  templateName: string;
  languageCode?: string;
  parameters?: string[];
}

/*
 Sends a WhatsApp template message.
*/
export async function sendTemplateMessage(params: SendWhatsAppMessageParams) {
  const payload = {
    to: params.phone,
    type: "template",
    template: {
      name: params.templateName,
      languageCode: params.languageCode || "en",
      bodyValues: params.parameters || [],
    },
  };

  const response = await gallaboxClient.post("/messages", payload);
  return response.data;
}

/*
 Sends a plain WhatsApp text message.
*/
export async function sendTextMessage(phone: string, message: string) {
  const payload = {
    to: phone,
    type: "text",
    text: {
      body: message,
    },
  };

  const response = await gallaboxClient.post("/messages", payload);
  return response.data;
}
