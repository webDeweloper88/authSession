export type RequestMetaData = {
  ipAddress: string;
  userAgent: string;
  client?: 'web' | 'mobile'; // Client type
  refreshToken?: string; // 👈 добавь эту строку
  sessionId?: string; // 👈 для logout и логов
};
