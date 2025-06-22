import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ApiKeyGuard } from '../api-key.guard';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let mockContext: ExecutionContext;
  let mockLogger: Logger;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockReflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    // Setup mocks
    mockLogger = Object.assign(new Logger(), {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    });

    // Fix Prisma mock type
    mockPrisma = {
      apiKey: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    } as any;

    mockReflector = {
      get: jest.fn()
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        { provide: Logger, useValue: mockLogger },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: Reflector, useValue: mockReflector }
      ],
    }).compile();

    guard = moduleRef.get<ApiKeyGuard>(ApiKeyGuard);
  });

  describe('canActivate', () => {
    it('should allow access with valid API key and scopes', async () => {
      const request = {
        headers: {
          'x-api-key': 'valid-api-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        }),
        getHandler: () => ({})
      } as ExecutionContext;

      // Fix mock implementation
      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          id: 'key-1',
          key: 'valid-api-key',
          status: 'ACTIVE',
          scopes: ['read:analytics'],
          orgId: 'org-1',
          expiresAt: new Date(Date.now() + 86400000),
          organization: {
            subdomain: 'test-org'
          }
        })
      );

      mockReflector.get.mockReturnValue(['read:analytics']);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('API key access granted')
      );
    });

    it('should deny access with missing API key', async () => {
      const request = {
        headers: {},
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('API key missing')
      );
    });

    it('should deny access with expired API key', async () => {
      const request = {
        headers: {
          'x-api-key': 'expired-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;

      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          id: 'key-1',
          key: 'expired-key',
          status: 'ACTIVE',
          scopes: ['read:analytics'],
          orgId: 'org-1',
          expiresAt: new Date(Date.now() - 86400000),
          organization: {
            subdomain: 'test-org'
          }
        })
      );

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Expired API key')
      );
    });

    it('should deny access with invalid API key', async () => {
      const request = {
        headers: {
          'x-api-key': 'invalid-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;

      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve(null)
      );

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid API key')
      );
    });

    it('should deny access with inactive API key', async () => {
      const request = {
        headers: {
          'x-api-key': 'inactive-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;

      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          id: 'key-1',
          key: 'inactive-key',
          status: 'INACTIVE',
          scopes: ['read:analytics'],
          orgId: 'org-1',
          expiresAt: null,
          organization: {
            subdomain: 'test-org'
          }
        })
      );

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Inactive API key')
      );
    });

    it('should handle database errors gracefully', async () => {
      const request = {
        headers: {
          'x-api-key': 'valid-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      } as ExecutionContext;

      const dbError = new Error('Database error');
      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.reject(dbError)
      );

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(UnauthorizedException);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'API key validation failed: requestId=unknown, ip=127.0.0.1, error=Database error',
        expect.any(Error)
      );
    });

    it('should update API key usage statistics', async () => {
      const request = {
        headers: {
          'x-api-key': 'valid-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        }),
        getHandler: () => ({})
      } as ExecutionContext;

      const now = new Date();
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockApiKey = {
        id: 'key-1',
        key: 'valid-key',
        status: 'ACTIVE',
        scopes: ['read:analytics'],
        orgId: 'org-1',
        expiresAt: null,
        organization: {
          subdomain: 'test-org'
        }
      };

      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve(mockApiKey)
      );

      mockReflector.get.mockReturnValue(['read:analytics']);

      await guard.canActivate(mockContext);

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockApiKey.id },
        data: {
          lastUsedAt: now,
          useCount: { increment: 1 }
        }
      });

      jest.useRealTimers();
    });

    it('should deny access with insufficient scopes', async () => {
      const request = {
        headers: {
          'x-api-key': 'limited-key'
        },
        ip: '127.0.0.1'
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request
        }),
        getHandler: () => ({})
      } as ExecutionContext;

      (mockPrisma.apiKey.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          id: 'key-1',
          key: 'limited-key',
          status: 'ACTIVE',
          scopes: ['read:basic'],
          orgId: 'org-1',
          expiresAt: null,
          organization: {
            subdomain: 'test-org'
          }
        })
      );

      mockReflector.get.mockReturnValue(['read:analytics']);

      await expect(guard.canActivate(mockContext))
        .rejects
        .toThrow(ForbiddenException);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Insufficient scope: requestId=unknown, required=read:analytics, actual=read:basic'
      );
    });
  });
});