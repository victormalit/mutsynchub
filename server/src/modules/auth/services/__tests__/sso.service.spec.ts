import { Test, TestingModule } from '@nestjs/testing';
import { SSOService } from '../sso.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('openid-client', () => ({
  Issuer: {
    discover: jest.fn(),
  },
}));

jest.mock('saml2-js', () => ({
  ServiceProvider: jest.fn().mockImplementation(() => ({
    create_login_request_url: jest.fn((options, extra, cb) => cb(null, 'https://saml-login-url')),
    post_assert: jest.fn((samlOptions, assertOptions, cb) =>
      cb(null, {
        user: {
          email: 'samluser@example.com',
          name: 'Saml User',
          name_id: 'saml-123',
        },
      })
    ),
  })),
}));

describe('SSOService', () => {
  let service: SSOService;
  let prisma: PrismaService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SSOService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            organization: {
              findFirst: jest.fn().mockResolvedValue({ id: 'org-1', status: 'ACTIVE' }),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map = {
                SSO_GOOGLE_CLIENT_ID: 'google-client-id',
                SSO_GOOGLE_CLIENT_SECRET: 'google-client-secret',
                SSO_GOOGLE_DISCOVERY_URL: 'https://accounts.google.com/.well-known/openid-configuration',
                SSO_GOOGLE_REDIRECT_URI: 'https://app/callback',
                SSO_GOOGLE_ENTITY_ID: 'entity-id',
                SSO_GOOGLE_PRIVATE_KEY: 'private-key',
                SSO_GOOGLE_CERTIFICATE: 'certificate',
                SSO_GOOGLE_ASSERT_ENDPOINT: 'https://app/assert',
                SSO_GOOGLE_AUDIENCE: 'audience',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SSOService>(SSOService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
  });

  describe('initializeOIDCClient', () => {
    it('should initialize OIDC client', async () => {
      const mockIssuer = {
        Client: jest.fn().mockImplementation(() => ({
          authorizationUrl: jest.fn().mockReturnValue('https://oidc-login-url'),
          callback: jest.fn().mockResolvedValue({ access_token: 'token' }),
          userinfo: jest.fn().mockResolvedValue({
            email: 'oidcuser@example.com',
            name: 'OIDC User',
            given_name: 'OIDC',
            family_name: 'User',
            sub: 'oidc-123',
          }),
        })),
      };
      const { Issuer } = require('openid-client');
      Issuer.discover.mockResolvedValue(mockIssuer);

      await service.initializeOIDCClient('google');
      expect(service['oidcClients'].get('google')).toBeDefined();
    });
  });

  describe('initializeSAMLProvider', () => {
    it('should initialize SAML provider', async () => {
      await service.initializeSAMLProvider('google');
      expect(service['samlProviders'].get('google')).toBeDefined();
    });
  });

  describe('handleOIDCLogin', () => {
    it('should return OIDC login URL', async () => {
      await service.initializeOIDCClient('google');
      const client = service['oidcClients'].get('google');
      client.authorizationUrl = jest.fn().mockReturnValue('https://oidc-login-url');
      const url = await service.handleOIDCLogin('google');
      expect(url).toBe('https://oidc-login-url');
    });

    it('should throw if OIDC client not initialized', async () => {
      await expect(service.handleOIDCLogin('notfound')).rejects.toThrow();
    });
  });

  describe('handleSAMLLogin', () => {
    it('should return SAML login URL', async () => {
      await service.initializeSAMLProvider('google');
      const url = await service.handleSAMLLogin('google');
      expect(url).toBe('https://saml-login-url');
    });

    it('should throw if SAML provider not initialized', async () => {
      await expect(service.handleSAMLLogin('notfound')).rejects.toThrow();
    });
  });

  describe('verifyOIDCCallback', () => {
    it('should find or create user and return user', async () => {
      await service.initializeOIDCClient('google');
      const client = service['oidcClients'].get('google');
      client.callback = jest.fn().mockResolvedValue({ access_token: 'token' });
      client.userinfo = jest.fn().mockResolvedValue({
        email: 'oidcuser@example.com',
        name: 'OIDC User',
        given_name: 'OIDC',
        family_name: 'User',
        sub: 'oidc-123',
      });

      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.create = jest.fn().mockResolvedValue({ id: 'user-1', email: 'oidcuser@example.com' });
      prisma.auditLog.create = jest.fn();

      const user = await service.verifyOIDCCallback('google', { code: 'auth-code' });
      expect(user).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on error', async () => {
      await service.initializeOIDCClient('google');
      const client = service['oidcClients'].get('google');
      client.callback = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(service.verifyOIDCCallback('google', {})).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifySAMLCallback', () => {
    it('should find or create user and return user', async () => {
      await service.initializeSAMLProvider('google');
      prisma.user.findUnique = jest.fn().mockResolvedValue(null);
      prisma.user.create = jest.fn().mockResolvedValue({ id: 'user-2', email: 'samluser@example.com' });
      prisma.auditLog.create = jest.fn();

      const user = await service.verifySAMLCallback('google', 'rawSAML');
      expect(user).toBeDefined();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on SAML assertion error', async () => {
      await service.initializeSAMLProvider('google');
      const samlProvider = service['samlProviders'].get('google');
      samlProvider.post_assert = jest.fn((samlOptions, assertOptions, cb) =>
        cb(new Error('fail'), null)
      );
      await expect(service.verifySAMLCallback('google', 'rawSAML')).rejects.toThrow(UnauthorizedException);
    });
  });
});