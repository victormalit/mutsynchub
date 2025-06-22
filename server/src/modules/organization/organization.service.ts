import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { OrgStatus } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    name: string;
    subdomain: string;
    settings?: Record<string, any>;
  }) {
    const existingOrg = await this.prisma.organization.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existingOrg) {
      throw new ConflictException('Subdomain already exists');
    }

    return this.prisma.organization.create({
      data: {
        ...data,
        status: OrgStatus.ACTIVE,
      },
    });
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        dataSources: true,
        subscription: true,
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findBySubdomain(subdomain: string) {
    const org = await this.prisma.organization.findUnique({
      where: { subdomain },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, data: {
    name?: string;
    settings?: Record<string, any>;
    status?: OrgStatus;
  }) {
    const org = await this.findById(id);
    
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const org = await this.findById(id);
    
    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
