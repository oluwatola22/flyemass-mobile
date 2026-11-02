/**
 * FlyeMass Payment Provider Integration Adapters
 * Encapsulates official API endpoints, signature validation specs,
 * settlement models, and distinguishes between Sandbox Verified and
 * Live Production integrations.
 */

export type IntegrationStatus = 'PASS' | 'SANDBOX_VERIFIED' | 'BLOCKED_AWAITING_CREDENTIALS' | 'SIMULATED';

export interface PaymentProviderConfig {
  id: string;
  name: string;
  category: 'NIGERIAN_NIP' | 'CARD_CHECKOUT' | 'CHINA_REMITTANCE';
  status: IntegrationStatus;
  statusDetails: string;
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  supportedCurrencies: string[];
  signatureAlgorithm: string;
  signatureHeader: string;
  reconciliationType: 'REALTIME_WEBHOOK' | 'NIP_POLLING' | 'DOCUMENTARY_SAFE_CLEARING';
  liveCredentialsRequired: string[];
}

export const PAYMENT_PROVIDERS: Record<string, PaymentProviderConfig> = {
  providus: {
    id: 'providus',
    name: 'Providus Bank Dynamic Virtual Accounts',
    category: 'NIGERIAN_NIP',
    status: 'SANDBOX_VERIFIED',
    statusDetails: 'Sandbox webhook verification fully tested with HMAC-SHA256 signature and replay protection. Live activation requires production client secret & corporate NIP settlement certificate.',
    sandboxBaseUrl: 'https://api.providusbank.com',
    productionBaseUrl: 'https://api.providusbank.com',
    supportedCurrencies: ['NGN'],
    signatureAlgorithm: 'HMAC-SHA256 (Raw Body)',
    signatureHeader: 'X-Auth-Signature or X-Providus-Signature',
    reconciliationType: 'REALTIME_WEBHOOK',
    liveCredentialsRequired: [
      'PROVIDUS_CLIENT_ID',
      'PROVIDUS_CLIENT_SECRET',
      'PROVIDUS_WEBHOOK_SECRET',
      'PROVIDUS_NIP_CERTIFICATE'
    ]
  },
  monnify: {
    id: 'monnify',
    name: 'Monnify Multi-Account & Card Gateway',
    category: 'CARD_CHECKOUT',
    status: 'SANDBOX_VERIFIED',
    statusDetails: 'HMAC-SHA512 webhook signature verification tested against test payload. Live activation requires approved Monnify merchant contract code & production API keys.',
    sandboxBaseUrl: 'https://sandbox.monnify.com',
    productionBaseUrl: 'https://api.monnify.com',
    supportedCurrencies: ['NGN'],
    signatureAlgorithm: 'HMAC-SHA512 (Raw Body against Secret Key)',
    signatureHeader: 'monnify-signature',
    reconciliationType: 'REALTIME_WEBHOOK',
    liveCredentialsRequired: [
      'MONNIFY_API_KEY',
      'MONNIFY_SECRET_KEY',
      'MONNIFY_WEBHOOK_SECRET',
      'MONNIFY_CONTRACT_CODE'
    ]
  },
  korapay: {
    id: 'korapay',
    name: 'Korapay Cross-Border Checkout & Cards',
    category: 'CARD_CHECKOUT',
    status: 'SANDBOX_VERIFIED',
    statusDetails: 'HMAC-SHA256 webhook parsing tested. Live activation requires production public/secret keys.',
    sandboxBaseUrl: 'https://api.korapay.com',
    productionBaseUrl: 'https://api.korapay.com',
    supportedCurrencies: ['NGN', 'USD'],
    signatureAlgorithm: 'HMAC-SHA256 (Raw Body)',
    signatureHeader: 'x-korapay-signature',
    reconciliationType: 'REALTIME_WEBHOOK',
    liveCredentialsRequired: [
      'KORAPAY_PUBLIC_KEY',
      'KORAPAY_SECRET_KEY',
      'KORAPAY_WEBHOOK_SECRET'
    ]
  },
  china_safe_remittance: {
    id: 'china_safe_remittance',
    name: 'China Cross-Border Trade Remittance (Alipay, WeChat, CNAPS)',
    category: 'CHINA_REMITTANCE',
    status: 'BLOCKED_AWAITING_CREDENTIALS',
    statusDetails: 'Administrative documentary processing active requiring Chinese clearingSessionId, paymentProofUrl, and SAFE declaration reference. Direct merchant automated payout API requires licensed Chinese financial partner clearance.',
    sandboxBaseUrl: 'https://sandbox.cnaps.pbc.gov.cn/v1',
    productionBaseUrl: 'https://gateway.cnaps.pbc.gov.cn/v1',
    supportedCurrencies: ['CNY'],
    signatureAlgorithm: 'RSA-SHA256 / SAFE Customs Declaration Tokens',
    signatureHeader: 'X-SAFE-Declaration-Ref',
    reconciliationType: 'DOCUMENTARY_SAFE_CLEARING',
    liveCredentialsRequired: [
      'CNAPS_PARTICIPANT_ID',
      'ALIPAY_MERCHANT_PRIVATE_KEY_PATH',
      'WECHAT_PAY_API_V3_KEY',
      'SAFE_ENTERPRISE_CODE'
    ]
  }
};
