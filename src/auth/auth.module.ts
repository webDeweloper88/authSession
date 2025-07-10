// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '../jwt/jwt.module';
import { RedisModule } from '../redis/redis.module';
import { TwoFactorAuthModule } from '../two-factor-auth/two-factor-auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessLogModule } from 'src/access-log/access-log.module';
import { SessionModule } from 'src/session/session.module';

@Module({
  imports: [
    UserModule,
    MailModule,
    JwtModule,
    RedisModule,
    TwoFactorAuthModule,
    PrismaModule,
    AccessLogModule,
    SessionModule, // Ensure SessionModule is imported if needed
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
