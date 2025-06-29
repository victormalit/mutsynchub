import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';

export const SUBSCRIPTION_TIER_KEY = 'subscriptionTier';
export type SubscriptionTier = 'STARTER' | 'BUSINESS' | 'CORPORATE';

export function RequiredSubscriptionTier(tier: SubscriptionTier): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(SUBSCRIPTION_TIER_KEY, tier, descriptor.value!);
    return descriptor;
  };
}

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.get<SubscriptionTier>(SUBSCRIPTION_TIER_KEY, context.getHandler());
    if (!requiredTier) return true; // No tier required

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('User not authenticated');

    // Fetch org from DB (or from request if already attached)
    const org = await this.prisma.organization.findUnique({
      where: { id: user.orgId },
      include: { subscription: true },
    });
    if (!org) throw new ForbiddenException('Organization not found');

    const tierOrder = ['STARTER', 'BUSINESS', 'CORPORATE'];
    const orgTier = org.subscription?.plan || 'STARTER';
    const orgTierIdx = tierOrder.indexOf(orgTier);
    const requiredTierIdx = tierOrder.indexOf(requiredTier);
    if (orgTierIdx < requiredTierIdx) {
      throw new ForbiddenException(`Upgrade to ${requiredTier} to access this feature.`);
    }
    return true;
  }
}
