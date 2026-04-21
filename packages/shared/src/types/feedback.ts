export interface Feedback {
  id: string;
  name: string;
  email?: string;
  type: string;
  message: string;
  rating: number;
  userId?: string;
  userName?: string;
  createdAt: string;
  diagnostics?: string;
}

export interface DiagnosticsPayload {
  pageUrl?: string;
  stepsToReproduce?: string;
  client?: {
    userAgent?: string;
    url?: string;
    appVersion?: string;
    capturedAt?: string;
    consoleLog?: { t: string; level: string; msg: string }[];
  };
}
