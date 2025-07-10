import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  sessionId: string; // 👈 добавить
  isTwoFactorAuthenticated?: boolean;
  client?: 'web' | 'mobile'; // <-- Добавь это
};

export type JwtTokens = {
  access_token: string;
  refresh_token: string;
};
