import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { MFAService } from './mfa.service';
import { User } from '@prisma/client';

@Injectable()
export class EnterpriseAuthService {
  private readonly logger = new Logger(EnterpriseAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly mfaService: MFAService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user.id);

    return user;
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user.failedLoginAttempts >= 5) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'SUSPENDED',
          lastLoginAt: new Date(),
        },
      });

      // Log security event
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_SUSPENDED',
          resource: 'USER',
          details: {
            reason: 'Too many failed login attempts',
            attempts: user.failedLoginAttempts,
          },
        },
      });
    }
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });
  }

  async login(user: User, mfaToken?: string): Promise<any> {
    // Check if MFA is required
    if (user.mfaEnabled && !mfaToken) {
      return {
        requiresMFA: true,
        tempToken: this.jwtService.sign(
          { id: user.id, type: 'MFA_REQUIRED' },
          { expiresIn: '5m' }
        ),
      };
    }

    // Validate MFA if enabled
    if (user.mfaEnabled) {
      const isValidMFA = await this.mfaService.validateToken(user.id, mfaToken);
      if (!isValidMFA) {
        throw new UnauthorizedException('Invalid MFA token');
      }
    }

    const tokens = await this.generateTokens(user);
    
    // Log successful login
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'AUTH',
        details: {
          method: user.mfaEnabled ? 'MFA' : 'PASSWORD',
        },
      },
    });

    return tokens;
  }

  private async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
        {
          expiresIn: '15m',
          secret: this.configService.get('JWT_SECRET'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          type: 'refresh',
        },
        {
          expiresIn: '7d',
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        },
      ),
    ]);

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      // Verify stored refresh token hash
      const isValidToken = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValidToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Blacklist the refresh token
    await this.tokenBlacklistService.blacklist(refreshToken);

    // Clear refresh token hash
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
      },
    });

    // Log logout
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        details: {
          method: 'EXPLICIT',
        },
      },
    });
  }

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return fake token to prevent email enumeration
      return this.jwtService.sign(
        { type: 'FAKE_RESET' },
        { expiresIn: '1h' }
      );
    }

    const token = this.jwtService.sign(
      {
        sub: user.id,
        type: 'PASSWORD_RESET',
      },
      { expiresIn: '1h' }
    );

    // Store token hash
    const tokenHash = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    return token;
  }
}
