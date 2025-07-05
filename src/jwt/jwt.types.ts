import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  isTwoFactorAuthenticated?: boolean;
};

export type JwtTokens = {
  access_token: string;
  refresh_token: string;
};
