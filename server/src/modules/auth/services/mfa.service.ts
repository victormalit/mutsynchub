import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { authenticator } from 'otplib';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class MFAService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Configure OTP library
    authenticator.options = {
      window: 1, // Allow 30 seconds of time drift
      step: 30,  // 30-second time step
    };
  }

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = authenticator.generateSecret();
    const appName = this.configService.get('APP_NAME', 'MutsynHub');
    const otpauth = authenticator.keyuri(user.email, appName, secret);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauth);

    // Store secret temporarily (user needs to verify it before it's activated)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaPendingSecret: secret,
      },
    });

    return {
      secret,
      qrCode,
    };
  }

  async verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaPendingSecret) {
      throw new UnauthorizedException('Invalid setup state');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaPendingSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    // Enable MFA and store the verified secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: null,
        mfaBackupCodes: this.generateBackupCodes(),
      },
    });

    // Log MFA enablement
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_ENABLED',
        resource: 'USER',
        details: {
          method: 'TOTP',
        },
      },
    });

    return true;
  }

  async validateToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('MFA not configured');
    }

    // Check if it's a backup code
    if (user.mfaBackupCodes?.includes(token)) {
      // Remove used backup code
      const updatedBackupCodes = user.mfaBackupCodes.filter(code => code !== token);
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaBackupCodes: updatedBackupCodes,
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'MFA_BACKUP_CODE_USED',
          resource: 'AUTH',
          details: {
            remainingCodes: updatedBackupCodes.length,
          },
        },
      });

      return true;
    }

    // Validate TOTP token
    return authenticator.verify({
      token,
      secret: user.mfaSecret,
    });
  }

  async disableMFA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.validateToken(userId, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'MFA_DISABLED',
        resource: 'USER',
        details: {},
      },
    });

    return true;
  }

  private generateBackupCodes(count = 10): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  private generateBackupCode(): string {
    return Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
    ).join('-');
  }
}
