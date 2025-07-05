import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountStatus, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { USER_ERRORS } from 'src/common/constants/errors';
import { UpdateUserProfileDto } from './dto/update-user.profile.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserAdminDto } from './dto/update-user.admin.dto';
import { CreateUserByAdminDto } from './dto/create-user.admin.dto';
import * as bcrypt from 'bcrypt';
import { UserSessionDto } from './dto/user-session.dto';
import { AccessLogDto } from './dto/access-log.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? '',
      pictureUrl: user.picktureUrl ?? '',
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const updated = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        picktureUrl: dto.pictureUrl,
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName ?? '',
      pictureUrl: updated.picktureUrl ?? '',
      role: updated.role,
      accountStatus: updated.accountStatus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.hash);

    if (!isMatch) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { hash: newHash },
    });

    return { message: 'Пароль успешно изменен' };
  }

  async createUserByAdmin(dto: CreateUserByAdminDto) {
    const existing = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(USER_ERRORS.ALREADY_EXISTS);
    }

    const hash = await bcrypt.hash(dto.hash, 10);

    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        hash,
        displayName: dto.displayName,
        picktureUrl: dto.pictureUrl,
        role: dto.role ?? UserRole.user,
        accountStatus: dto.accountStatus ?? AccountStatus.ACTIVE,
        emailVerified: true, // Так как админ создаёт вручную
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: string): Promise<UserProfileDto> {
    const user = await this.prismaService.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? '',
      pictureUrl: user.picktureUrl ?? '',
      role: user.role,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  async findAll(dto: FilterUsersDto) {
    const { role, status, email, page = 1, limit = 10 } = dto;

    const where = {
      ...(role && { role }),
      ...(status && { accountStatus: status }),
      ...(email && {
        email: {
          contains: email,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      total,
      page,
      limit,
      data: data.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? '',
        pictureUrl: user.picktureUrl ?? '',
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }

  async updateByAdmin(userId: string, dto: UpdateUserAdminDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...(dto.role && { role: dto.role }),
        ...(dto.accountStatus && { accountStatus: dto.accountStatus }),
      },
    });
  }

  async deleteByAdmin(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    return this.prismaService.user.update({
      where: { id: userId },
      data: { accountStatus: AccountStatus.DELETED },
    });
  }

  async getUserSessions(userId: string): Promise<UserSessionDto[]> {
    const sessions = await this.prismaService.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent ?? '',
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
    }));
  }

  async deleteSessionByUser(userId: string, sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Сессия не найдена или недоступна');
    }

    return this.prismaService.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteSessionByAdmin(userId: string, sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException(
        'Сессия не найдена или не принадлежит пользователю',
      );
    }

    return this.prismaService.session.delete({
      where: { id: sessionId },
    });
  }

  async getMyAccessLogs(userId: string): Promise<AccessLogDto[]> {
    const logs = await this.prismaService.accessLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt,
    }));
  }

  async getAccessLogsByAdmin(userId: string): Promise<AccessLogDto[]> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(USER_ERRORS.NOT_FOUND);
    }

    const logs = await this.prismaService.accessLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      ipAddress: log.ipAddress ?? '',
      userAgent: log.userAgent ?? '',
      createdAt: log.createdAt,
    }));
  }

  async enable2FA(userId: string, secret: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorExpiresAt: null, // если используешь TTL
      },
    });

    return { message: '2FA включена' };
  }

  async disable2FA(userId: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorExpiresAt: null,
      },
    });

    return { message: '2FA отключена' };
  }

  // --- Internal methods ---
  /**
   * Найти пользователя по ID
   */
  async findByIdInternal(userId: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Найти пользователя по email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  /**
   * Установить hash пароля напрямую (например, при сбросе пароля)
   */
  async updatePassword(userId: string, newHash: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { hash: newHash },
    });
  }

  /**
   * Установить emailVerified в true
   */
  async markEmailVerified(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        accountStatus: AccountStatus.ACTIVE,
      },
    });
  }

  /**
   * Установить token для верификации email
   */
  async setEmailVerificationToken(
    userId: string,
    token: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
      },
    });
  }

  /**
   * Найти пользователя по токену подтверждения email
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: { emailVerificationToken: token },
    });
  }
}
