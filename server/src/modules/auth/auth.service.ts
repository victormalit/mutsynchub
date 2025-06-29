import { Injectable, UnauthorizedException, Logger, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { OrganizationService } from '../organization/organization.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // For demo: in-memory failed login tracker (use Redis in prod)
  private failedAttempts: Record<string, number> = {};
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes
  private lockoutUntil: Record<string, number> = {};

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly organizationService: OrganizationService, // Inject OrganizationService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login failed: user not found for email=${email}`);
      return null;
    }
    // Account lockout check
    if (this.lockoutUntil[email] && Date.now() < this.lockoutUntil[email]) {
      this.logger.warn(`Account locked: email=${email}`);
      throw new ForbiddenException('Account temporarily locked due to repeated failed login attempts.');
    }
    const passwordValid = await argon2.verify(user.password, password);
    if (passwordValid) {
      this.failedAttempts[email] = 0;
      const { password, ...result } = user;
      this.logger.log(`Login success: email=${email}`);
      return result;
    } else {
      this.failedAttempts[email] = (this.failedAttempts[email] || 0) + 1;
      this.logger.warn(`Login failed: email=${email}, failedAttempts=${this.failedAttempts[email]}`);
      if (this.failedAttempts[email] >= this.MAX_FAILED_ATTEMPTS) {
        this.lockoutUntil[email] = Date.now() + this.LOCKOUT_TIME_MS;
        this.logger.warn(`Account locked: email=${email}`);
      }
      return null;
    }
  }

  async login(user: any) {
    // MFA placeholder: check if user requires MFA, verify code, etc.
    // if (user.mfaEnabled) { ... }
    const payload = { email: user.email, sub: user.id };
    // Short-lived access token
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    // (Optional) Issue refresh token, store in DB/Redis, handle rotation/blacklist
    // const refreshToken = ...
    this.logger.log(`JWT issued: user=${user.id}, email=${user.email}`);
    return {
      access_token: accessToken,
      // refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(registerDto: any) {
    // 1. Create organization
    const organization = await this.organizationService.create({
      name: registerDto.organizationName,
      subdomain: registerDto.subdomain,
    });
    // 2. Hash password before creating user (argon2)
    const hashedPassword = await argon2.hash(registerDto.password);
    // 3. Create user with orgId
    const user = await this.userService.create({
      ...registerDto,
      orgId: organization.id,
      password: hashedPassword,
    });
    this.logger.log(`User registered: email=${user.email}, id=${user.id}, orgId=${organization.id}`);
    return this.login(user);
  }
}
