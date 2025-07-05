import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Delete,
  Post,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiParam,
  ApiBearerAuth,
  ApiTags,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserProfileDto } from './dto/user-profile.dto';
import { CurrentUser } from 'src/jwt/decorators/current-user.decorator';
import { UpdateUserProfileDto } from './dto/update-user.profile.dto';
import { Roles } from 'src/jwt/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { USER_ERRORS } from 'src/common/constants/errors';
import { FilterUsersDto } from './dto/filter-users.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AtGuard } from 'src/jwt/guards/at.guard';
import { RolesGuard } from 'src/jwt/guards/roles.guard';
import { UpdateUserAdminDto } from './dto/update-user.admin.dto';
import { CreateUserByAdminDto } from './dto/create-user.admin.dto';
import { UserSessionDto } from './dto/user-session.dto';
import { AccessLogDto } from './dto/access-log.dto';
import { QRCodeDto } from './dto/qr-code.dto';
import { TwoFactorAuthService } from 'src/two-factor-auth/two-factor-auth.service';
import { Verify2FADto } from './dto/verify-2fa.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
// @ApiBearerAuth('JWT-auth')
// @UseGuards(AtGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly twoFAService: TwoFactorAuthService, // Injecting TwoFactorAuthService to use its methods
  ) {}

  @Get('profile')
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Профиль текущего пользователя',
  })
  getMe(@CurrentUser('sub') userId: string): Promise<UserProfileDto> {
    return this.userService.getProfile(userId);
  }

  @Patch('update-profile')
  @ApiOkResponse({ type: UserProfileDto })
  updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  @Patch('me/change-password')
  @ApiOkResponse({ description: 'Пароль успешно изменен' })
  @ApiBadRequestResponse({ description: 'Неверный текущий пароль' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(userId, dto);
  }

  @Roles(UserRole.admin)
  @Post('create-user-by-admin')
  @ApiOkResponse({
    type: UserProfileDto,
    description: 'Создан новый пользователь',
  })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiConflictResponse({ description: USER_ERRORS.ALREADY_EXISTS })
  createByAdmin(@Body() dto: CreateUserByAdminDto) {
    return this.userService.createUserByAdmin(dto);
  }

  @Roles(UserRole.admin)
  @Get('find-by-id/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Roles(UserRole.admin)
  @Get('find-all')
  @ApiOkResponse({
    description: 'Список пользователей с фильтрацией и пагинацией',
  })
  getAll(@Query() dto: FilterUsersDto) {
    return this.userService.findAll(dto);
  }

  @Roles(UserRole.admin)
  @Patch('update-by-admin/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  updateByAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    return this.userService.updateByAdmin(id, dto);
  }

  @Roles(UserRole.admin)
  @Delete('delete-by-admin/:id')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({ description: 'Пользователь помечен как удалён' })
  @ApiNoContentResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  deleteByAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteByAdmin(id);
  }

  @Roles(UserRole.admin)
  @Get(':id/sessions')
  @ApiOkResponse({
    type: [UserSessionDto],
    description: 'Список активных сессий пользователя (admin only)',
  })
  getUserSessionsAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserSessions(id);
  }

  @Get('me/sessions')
  @ApiOkResponse({
    type: [UserSessionDto],
    description: 'Список моих активных сессий',
  })
  getMySessions(@CurrentUser('sub') userId: string) {
    return this.userService.getUserSessions(userId);
  }

  @Delete('me/sessions/:sessionId')
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ description: 'Сессия удалена' })
  @ApiNotFoundResponse({ description: 'Сессия не найдена или недоступна' })
  deleteMySession(
    @CurrentUser('sub') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.userService.deleteSessionByUser(userId, sessionId);
  }

  @Roles(UserRole.admin)
  @Delete(':id/sessions/:sessionId')
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiOkResponse({ description: 'Сессия удалена админом' })
  @ApiNotFoundResponse({
    description: 'Сессия не найдена или принадлежит другому пользователю',
  })
  deleteSessionByAdmin(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.userService.deleteSessionByAdmin(userId, sessionId);
  }

  @Get('me/access-logs')
  @ApiOkResponse({
    type: [AccessLogDto],
    description: 'История входов пользователя',
  })
  getAccessLogs(@CurrentUser('sub') userId: string) {
    return this.userService.getMyAccessLogs(userId);
  }

  @Roles(UserRole.admin)
  @Get(':id/access-logs')
  @ApiParam({ name: 'id', type: String, description: 'ID пользователя' })
  @ApiOkResponse({
    type: [AccessLogDto],
    description: 'История входов пользователя (admin only)',
  })
  @ApiNotFoundResponse({ description: USER_ERRORS.NOT_FOUND })
  @ApiForbiddenResponse({ description: USER_ERRORS.FORBIDDEN })
  getAccessLogsByAdmin(@Param('id', ParseUUIDPipe) userId: string) {
    return this.userService.getAccessLogsByAdmin(userId);
  }

  @HttpCode(200)
  @Post('me/2fa/setup')
  @ApiOkResponse({
    type: QRCodeDto,
    description: 'QR-код и секрет для настройки 2FA',
  })
  async setup2FA(@CurrentUser('sub') userId: string): Promise<QRCodeDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error('User not found');
    }
    const { base32, otpauthUrl } = this.twoFAService.generateSecret(user.email);
    if (!otpauthUrl) {
      throw new Error('Failed to generate otpauthUrl for 2FA setup');
    }
    const qrCodeImage = await this.twoFAService.generateQRCode(otpauthUrl);

    return { qrCodeImage, secret: base32 };
  }

  @HttpCode(200)
  @Post('me/2fa/verify')
  @ApiOkResponse({ description: '2FA успешно включена' })
  async verify2FA(
    @CurrentUser('sub') userId: string,
    @Body() dto: Verify2FADto,
  ) {
    const isValid = this.twoFAService.verifyCode(dto.secret, dto.token);

    if (!isValid) {
      throw new BadRequestException('Неверный код 2FA');
    }

    return this.userService.enable2FA(userId, dto.secret);
  }
}
