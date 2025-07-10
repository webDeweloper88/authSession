import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestMetaData } from '../types/request-meta.type';

export const RequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestMetaData => {
    const request = ctx.switchToHttp().getRequest();

    const rawIp =
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.connection?.remoteAddress;

    const ipAddress = Array.isArray(rawIp) ? rawIp[0] : rawIp;

    return {
      ipAddress,
      userAgent: request.headers['user-agent'] || 'Unknown',
      client: request.headers['x-client'] as 'web' | 'mobile',
      refreshToken: request.cookies?.refresh_token,
      sessionId: request.user?.sessionId,
    };
  },
);
