import { Controller, Post, Body, UseGuards, Get, Request, Res, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SSOService } from './services/sso.service';
import { Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ssoService: SSOService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user and organization' })
  @ApiResponse({ status: 201, description: 'Successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile data' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get('sso/google')
  @ApiOperation({ summary: 'Initiate Google SSO login' })
  async googleSSO(@Res() res: Response) {
    await this.ssoService.initializeOIDCClient('google');
    const url = await this.ssoService.handleOIDCLogin('google');
    return res.redirect(url);
  }

  @Get('sso/google/callback')
  @ApiOperation({ summary: 'Google SSO callback' })
  async googleSSOCallback(@Request() req, @Res() res: Response, @Query() query: any) {
    try {
      const user = await this.ssoService.verifyOIDCCallback('google', query);
      // Redirect to frontend analytics landing page with success
      return res.redirect(`${process.env.FRONTEND_URL}/analytics?success=1`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errMsg)}`);
    }
  }
}
