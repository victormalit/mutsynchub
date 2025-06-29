import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { AuditLoggerService } from '../../../audit/audit-logger.service';
import { Issuer } from 'openid-client';
import * as saml2 from 'saml2-js';
import { randomBytes } from 'crypto';
import { SSOUserInfo, SSOConfig, SAMLResponse } from '../interfaces/sso.interface';

@Injectable()
export class SSOService {
  private readonly logger = new Logger(SSOService.name);
  private readonly oidcClients = new Map<string, any>();
  private readonly samlProviders = new Map<string, saml2.ServiceProvider>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async initializeOIDCClient(provider: string): Promise<void> {
    try {
      const config = this.getProviderConfig(provider);
      const issuer = await Issuer.discover(config.discoveryUrl);

      const client = new issuer.Client({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uris: [config.redirectUri],
        response_types: ['code'],
      });

      this.oidcClients.set(provider, client);
      this.logger.log(`Initialized OIDC client for ${provider}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize OIDC client for ${provider}:`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  async initializeSAMLProvider(provider: string): Promise<void> {
    try {
      const config = this.getProviderConfig(provider);
      
      const samlConfig = {
        entity_id: config.entityId,
        private_key: config.privateKey,
        certificate: config.certificate,
        assert_endpoint: config.assertEndpoint,
        audience: config.audience,
      };

      const serviceProvider = new saml2.ServiceProvider(samlConfig);
      this.samlProviders.set(provider, serviceProvider);
      this.logger.log(`Initialized SAML provider for ${provider}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize SAML provider for ${provider}:`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  private getProviderConfig(provider: string): SSOConfig {
    const upperProvider = provider.toUpperCase();
    const config = {
      clientId: this.configService.get(`SSO_${upperProvider}_CLIENT_ID`),
      clientSecret: this.configService.get(`SSO_${upperProvider}_CLIENT_SECRET`),
      discoveryUrl: this.configService.get(`SSO_${upperProvider}_DISCOVERY_URL`),
      redirectUri: this.configService.get(`SSO_${upperProvider}_REDIRECT_URI`),
      entityId: this.configService.get(`SSO_${upperProvider}_ENTITY_ID`),
      privateKey: this.configService.get(`SSO_${upperProvider}_PRIVATE_KEY`),
      certificate: this.configService.get(`SSO_${upperProvider}_CERTIFICATE`),
      assertEndpoint: this.configService.get(`SSO_${upperProvider}_ASSERT_ENDPOINT`),
      audience: this.configService.get(`SSO_${upperProvider}_AUDIENCE`),
    };
    // Only require OIDC fields for Google, SAML fields for others
    if (provider.toLowerCase() === 'google') {
      const required = ['clientId', 'clientSecret', 'discoveryUrl', 'redirectUri'];
      for (const key of required) {
        if (!config[key]) {
          throw new Error(`Missing SSO config for ${provider}: ${key}`);
        }
      }
    } else {
      // SAML or other providers
      for (const [key, value] of Object.entries(config)) {
        if (!value) {
          throw new Error(`Missing SSO config for ${provider}: ${key}`);
        }
      }
    }
    return config;
  }

  async handleOIDCLogin(provider: string): Promise<string> {
    const client = this.oidcClients.get(provider);
    if (!client) {
      throw new Error(`OIDC client not initialized for ${provider}`);
    }

    return client.authorizationUrl({
      scope: 'openid email profile',
      state: randomBytes(16).toString('hex'),
    });
  }

  async handleSAMLLogin(provider: string): Promise<string> {
    const samlProvider = this.samlProviders.get(provider);
    if (!samlProvider) {
      throw new Error(`SAML provider not initialized for ${provider}`);
    }

    return new Promise((resolve, reject) => {
      const options = {
        relay_state: randomBytes(16).toString('hex'),
      };

      samlProvider.create_login_request_url(
        options,
        { force_authn: true },
        (err: Error, loginUrl: string) => {
          if (err) reject(err);
          else resolve(loginUrl);
        }
      );
    });
  }

  async verifyOIDCCallback(provider: string, params: any): Promise<any> {
    const client = this.oidcClients.get(provider);
    if (!client) {
      throw new Error(`OIDC client not initialized for ${provider}`);
    }

    try {
      const state = params.state;
      const tokenSet = await client.callback(
        this.getProviderConfig(provider).redirectUri,
        params,
        { state } // Pass state to checks
      );

      const userInfo = await client.userinfo(tokenSet.access_token);
      return this.findOrCreateUser(provider, userInfo);
    } catch (error) {
      this.logger.error(
        `OIDC callback verification failed:`,
        error instanceof Error ? error.stack : String(error)
      );
      throw new UnauthorizedException('Failed to verify OIDC callback');
    }
  }

  async verifySAMLCallback(provider: string, rawResponse: string): Promise<any> {
    const samlProvider = this.samlProviders.get(provider);
    if (!samlProvider) {
      throw new Error(`SAML provider not initialized for ${provider}`);
    }

    return new Promise((resolve, reject) => {
      const samlOptions = {
        SAMLResponse: rawResponse,
      };

      const assertOptions = {
        allow_unencrypted_assertion: true,
        request_body: samlOptions,
      };

      samlProvider.post_assert(
        samlOptions,
        assertOptions,
        async (err: Error, samlResponse: SAMLResponse) => {
          if (err) {
            this.logger.error(`SAML assertion failed:`, err.stack);
            reject(new UnauthorizedException('Failed to verify SAML assertion'));
          } else {
            try {
              const userInfo: SSOUserInfo = {
                email: samlResponse.user.email,
                name: samlResponse.user.name,
                provider_user_id: samlResponse.user.name_id,
              };
              resolve(await this.findOrCreateUser(provider, userInfo));
            } catch (error) {
              reject(error);
            }
          }
        }
      );
    });
  }

  private async findOrCreateUser(provider: string, userInfo: SSOUserInfo): Promise<any> {
    try {
      // Try to find user by email
      let user = await this.prisma.user.findUnique({
        where: { email: userInfo.email },
      });

      if (!user) {
        // Find or create default organization
        let defaultOrg = await this.prisma.organization.findFirst({
          where: { status: 'ACTIVE' },
        });
        if (!defaultOrg) {
          // Create a default organization for the first SSO user
          defaultOrg = await this.prisma.organization.create({
            data: {
              name: 'Default Organization',
              status: 'ACTIVE',
              subdomain: 'default', // You may want to generate or configure this value
              // TODO: Add more org fields as needed
            },
          });
          // Optionally, assign this user as an admin/owner
        }

        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: userInfo.email,
            firstName: userInfo.given_name || userInfo.name?.split(' ')[0],
            lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' '),
            status: 'ACTIVE',
            organization: {
              connect: {
                id: defaultOrg.id,
              },
            },
            password: randomBytes(32).toString('hex'),
          },
        });

        // Log user creation
        await this.auditLogger.log({
          userId: user.id,
          action: 'USER_CREATED',
          resource: 'USER',
          details: {
            method: 'SSO',
            provider,
            orgId: defaultOrg.id,
          },
          orgId: defaultOrg.id,
        });
      }

      // Log SSO login
      await this.auditLogger.log({
        userId: user.id,
        action: 'SSO_LOGIN',
        resource: 'AUTH',
        details: {
          provider,
          method: 'SSO',
          orgId: user.orgId,
        },
        orgId: user.orgId,
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to process SSO user:`,
        error instanceof Error ? error.stack : String(error)
      );
      throw new UnauthorizedException('Failed to process SSO login');
    }
  }
}
