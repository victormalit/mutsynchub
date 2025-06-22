import { Controller, Get, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('ADMIN')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  @Roles('ADMIN')
  async setUserRole(
    @Param('id') userId: string,
    @Body() body: { role: UserRole },
    @Req() req
  ) {
    const adminId = req.user?.id;
    const orgId = req.user?.orgId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.setUserRole(userId, body.role, { adminId, orgId, ipAddress, userAgent });
  }

  @Get('organizations')
  @Roles('ADMIN')
  async getAllOrganizations() {
    return this.adminService.getAllOrganizations();
  }

  @Put('organizations/:id/status')
  @Roles('ADMIN')
  async setOrganizationStatus(
    @Param('id') orgId: string,
    @Body() body: { status: string },
    @Req() req
  ) {
    const adminId = req.user?.id;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.adminService.setOrganizationStatus(orgId, body.status, { adminId, ipAddress, userAgent });
  }
}
