import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TwoFactorAuthModule } from 'src/two-factor-auth/two-factor-auth.module';

@Module({
  imports: [TwoFactorAuthModule], // Importing TwoFactorAuthModule to use its services
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
