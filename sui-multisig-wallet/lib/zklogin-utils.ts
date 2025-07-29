import {
  generateNonce,
  generateRandomness,
  genAddressSeed,
  getZkLoginSignature
} from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  iss?: string;
  sub?: string; // Subject ID
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
}

export interface ZkLoginSession {
  ephemeralKeyPair: Ed25519Keypair;
  maxEpoch: number;
  randomness: string;
  nonce: string;
  userSalt?: string;
  zkLoginAddress?: string;
  jwt?: string;
  zkProof?: any;
}

export interface OAuthProvider {
  name: string;
  authUrl: string;
  tokenExchangeUrl?: string;
  authFlowOnly: boolean;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&response_type=id_token&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE',
    authFlowOnly: true
  },
  facebook: {
    name: 'Facebook',
    authUrl: 'https://www.facebook.com/v17.0/dialog/oauth?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=openid&nonce=$NONCE&response_type=id_token',
    authFlowOnly: true
  },
  twitch: {
    name: 'Twitch',
    authUrl: 'https://id.twitch.tv/oauth2/authorize?client_id=$CLIENT_ID&force_verify=true&lang=en&login_type=login&redirect_uri=$REDIRECT_URL&response_type=id_token&scope=openid&nonce=$NONCE',
    authFlowOnly: true
  },
  kakao: {
    name: 'Kakao',
    authUrl: 'https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE',
    tokenExchangeUrl: 'https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&code=$AUTH_CODE',
    authFlowOnly: false
  },
  apple: {
    name: 'Apple',
    authUrl: 'https://appleid.apple.com/auth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&scope=email&response_mode=form_post&response_type=code%20id_token&nonce=$NONCE',
    authFlowOnly: true
  },
  slack: {
    name: 'Slack',
    authUrl: 'https://slack.com/openid/connect/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URL&nonce=$NONCE&scope=openid',
    tokenExchangeUrl: 'https://slack.com/api/openid.connect.token?code=$AUTH_CODE&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET',
    authFlowOnly: false
  },
  microsoft: {
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=$CLIENT_ID&scope=openid&response_type=id_token&nonce=$NONCE&redirect_uri=$REDIRECT_URL',
    authFlowOnly: true
  }
};

export class ZkLoginManager {
  private session: ZkLoginSession | null = null;

  async initializeSession(suiClient: SuiClient, maxEpochOffset: number = 2): Promise<ZkLoginSession> {
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + maxEpochOffset;

    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

    this.session = {
      ephemeralKeyPair,
      maxEpoch,
      randomness,
      nonce
    };

    return this.session;
  }

  getOAuthUrl(provider: string, clientId: string, redirectUrl: string): string {
    const providerConfig = OAUTH_PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    if (!this.session) {
      throw new Error('Session not initialized. Call initializeSession first.');
    }

    return providerConfig.authUrl
      .replace('$CLIENT_ID', clientId)
      .replace('$REDIRECT_URL', encodeURIComponent(redirectUrl))
      .replace('$NONCE', this.session.nonce);
  }

  async processOAuthCallback(
    provider: string,
    authCode: string,
    clientId: string,
    clientSecret?: string
  ): Promise<string> {
    const providerConfig = OAUTH_PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    if (providerConfig.authFlowOnly) {
      // For auth flow only providers, the JWT is in the redirect URL
      return authCode; // authCode is actually the JWT here
    }

    // For providers that need token exchange
    if (!providerConfig.tokenExchangeUrl) {
      throw new Error(`Provider ${provider} requires token exchange but no URL configured`);
    }

    const tokenUrl = providerConfig.tokenExchangeUrl
      .replace('$AUTH_CODE', authCode)
      .replace('$CLIENT_ID', clientId)
      .replace('$CLIENT_SECRET', clientSecret || '');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id_token || data.access_token;
  }

  decodeJwt(jwt: string): JwtPayload {
    return jwtDecode(jwt) as JwtPayload;
  }

  async generateZkLoginAddress(jwt: string, userSalt: string): Promise<string> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    const decodedJwt = this.decodeJwt(jwt);
    const addressSeed = genAddressSeed(
      BigInt(userSalt),
      'sub',
      decodedJwt.sub!,
      Array.isArray(decodedJwt.aud) ? decodedJwt.aud[0] : decodedJwt.aud!
    ).toString();

    // Store in session for later use
    this.session.jwt = jwt;
    this.session.userSalt = userSalt;
    this.session.zkLoginAddress = addressSeed;

    return addressSeed;
  }

  async getZkProof(jwt: string, userSalt: string): Promise<any> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }

    const decodedJwt = this.decodeJwt(jwt);
    const addressSeed = genAddressSeed(
      BigInt(userSalt),
      'sub',
      decodedJwt.sub!,
      Array.isArray(decodedJwt.aud) ? decodedJwt.aud[0] : decodedJwt.aud!
    ).toString();

    const zkpRequestPayload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'zkLogin_authenticate',
      params: [
        this.session.randomness,
        decodedJwt.sub!,
        decodedJwt.aud!,
        decodedJwt.iss!,
        addressSeed,
        this.session.maxEpoch,
        jwt
      ]
    };

    // Use Mysten Labs maintained proving service
    const response = await fetch('https://zklogin-prover-dev.mystenlabs.com/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zkpRequestPayload),
    });

    if (!response.ok) {
      throw new Error(`ZKP request failed: ${response.statusText}`);
    }

    const proofResponse = await response.json();
    this.session.zkProof = proofResponse.result;

    return proofResponse.result;
  }

  async createZkLoginSignature(
    transactionBytes: Uint8Array,
    userSignature: string | Uint8Array
  ): Promise<string> {
    if (!this.session?.zkProof || !this.session.userSalt || !this.session.jwt) {
      throw new Error('Missing required session data. Ensure JWT and ZK proof are available.');
    }

    const decodedJwt = this.decodeJwt(this.session.jwt);
    const addressSeed = genAddressSeed(
      BigInt(this.session.userSalt),
      'sub',
      decodedJwt.sub!,
      Array.isArray(decodedJwt.aud) ? decodedJwt.aud[0] : decodedJwt.aud!
    ).toString();

    const zkLoginSignature = getZkLoginSignature({
      inputs: {
        ...this.session.zkProof,
        addressSeed,
      },
      maxEpoch: this.session.maxEpoch,
      userSignature: typeof userSignature === 'string' ? userSignature : toB64(userSignature),
    });

    return zkLoginSignature;
  }

  getSession(): ZkLoginSession | null {
    return this.session;
  }

  clearSession(): void {
    this.session = null;
  }
}

// Utility function to convert Uint8Array to base64
function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}