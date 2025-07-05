import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IS_DEV_ENV } from './common/utils/is-dev.utils';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { JwtModule } from './jwt/jwt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !IS_DEV_ENV, // Agar isDev false bo'lsa, .env faylini e'tiborga olmaslik
      envFilePath: IS_DEV_ENV ? '.env' : '.env.production', // Agar isDev true bo'lsa, .env faylini yuklash
    }),
    PrismaModule,
    UserModule,
    JwtModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
