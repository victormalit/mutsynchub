import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockContext: ExecutionContext;
  let mockLogger: Logger;

  beforeEach(async () => {
    // Create mock logger with all required methods
    mockLogger = Object.assign(new Logger(), {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: Logger, useValue: mockLogger }
      ],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('canActivate', () => {
    it('should allow access when JWT and tenant ID match', async () => {
      // Setup request with matching tenant IDs
      const request = {
        user: {
          id: 'test-user-id',
          tenantId: 'test-tenant-id'
        },
        headers: {
          'x-tenant-id': 'test-tenant-id'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({})
        })
      } as ExecutionContext;

      // Mock successful JWT validation
      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockImplementation(() => Promise.resolve(true));

      const result = await guard.canActivate(mockContext);
      
      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('JWT Auth success')
      );
    });

    it('should deny access when tenant IDs do not match', async () => {
      // Setup request with mismatched tenant IDs
      const request = {
        user: {
          id: 'test-user-id',
          tenantId: 'tenant-1'
        },
        headers: {
          'x-tenant-id': 'tenant-2'  // Intentionally different from user's tenantId
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({})
        })
      } as ExecutionContext;

      // First mock the parent AuthGuard to succeed
      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true);

      // Now test that our guard throws for tenant mismatch
      try {
        await guard.canActivate(mockContext);
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        // Verify it's the right error
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Tenant mismatch');
        
        // Verify the warning was logged with correct details
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Tenant isolation violation: user=test-user-id, ' +
          'userTenant=tenant-1, headerTenant=tenant-2, ip=127.0.0.1'
        );
      }
    });

    it('should deny access when JWT validation fails', async () => {
      const request = {
        headers: {},
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({})
        })
      } as ExecutionContext;

      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(false);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('JWT validation failed')
      );
    });

    it('should handle JWT errors gracefully', async () => {
      const request = {
        headers: { authorization: 'Bearer invalid' },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({})
        })
      } as ExecutionContext;

      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new Error('JWT Error'));

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('JWT Auth error'),
        expect.any(String)
      );
    });
  });
});