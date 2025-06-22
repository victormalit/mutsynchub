export interface SSOUserInfo {
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  provider_user_id?: string;
  sub?: string;
}

export interface SSOConfig {
  clientId: string;
  clientSecret: string;
  discoveryUrl?: string;
  redirectUri: string;
  entityId?: string;
  certificate?: string;
  privateKey?: string;
  assertEndpoint?: string;
  audience?: string;
}

export interface SAMLResponse {
  user: {
    name_id: string;
    email?: string;
    name?: string;
    attributes?: Record<string, any>;
  };
}
