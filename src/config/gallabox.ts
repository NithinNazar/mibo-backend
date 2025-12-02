// src/config/gallabox.ts
import axios from "axios";
import { ENV } from "./env";

export const gallaboxClient = axios.create({
  baseURL: ENV.GALLABOX_BASE_URL || "https://api.gallabox.com/wa/api/v1",
  headers: {
    apiKey: ENV.GALLABOX_API_KEY || "",
    apiSecret: ENV.GALLABOX_API_SECRET || "",
    "Content-Type": "application/json",
  },
});
