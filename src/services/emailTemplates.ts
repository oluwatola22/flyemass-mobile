/**
 * FLYEMASS BRANDED TRANSACTIONAL EMAIL TEMPLATES
 * 
 * Standards:
 * - Enterprise Dark-Mode Luxury Palette: Deep obsidian (#020617, #0f172a), slate borders (#1e293b, #334155), neon green accents (#10b981, #34d399).
 * - High-Contrast Typography: Crisp white (#f8fafc) headings, muted slate (#94a3b8) body text.
 * - Comprehensive Metadata: Transaction reference tokens, timestamps (WAT/UTC), currency symbols ($, ₦, ¥), warehouse marks.
 * - Anti-Phishing & Security: Official FlyeMass verified security seal, direct mobile vault deep links.
 */

export type TransactionalEmailEvent = 
  | 'ACCOUNT_WELCOME'
  | 'WALLET_FUNDING'
  | 'FX_SWAP'
  | 'SUPPLIER_PAYOUT'
  | 'CARGO_RECEIVED'
  | 'SHOP_ORDER'
  | 'SUPPORT_TICKET';

export interface EmailRecipient {
  email: string;
  name: string;
  userId?: string;
  flyeTag?: string;
}

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
  eventType: TransactionalEmailEvent;
}

const BASE_STYLES = `
  body {
    margin: 0;
    padding: 0;
    background-color: #020617;
    color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .wrapper {
    width: 100%;
    background-color: #020617;
    padding: 32px 16px;
  }
  .container {
    max-width: 580px;
    margin: 0 auto;
    background-color: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  }
  .header {
    background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
    padding: 28px 32px;
    border-bottom: 1px solid #1e293b;
    text-align: center;
  }
  .logo-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    margin: 0;
  }
  .logo-badge {
    color: #10b981;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }
  .content {
    padding: 32px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }
  .badge-emerald {
    background-color: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.35);
    color: #34d399;
  }
  .badge-amber {
    background-color: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #fbbf24;
  }
  .badge-indigo {
    background-color: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.35);
    color: #a5b4fc;
  }
  .title {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 12px 0;
    line-height: 1.3;
  }
  .lead {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0 0 24px 0;
  }
  .data-card {
    background-color: #020617;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 20px;
    margin: 20px 0;
  }
  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #0f172a;
    font-size: 13px;
  }
  .data-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .data-label {
    color: #64748b;
  }
  .data-value {
    color: #ffffff;
    font-weight: 600;
    text-align: right;
  }
  .amount-highlight {
    font-size: 24px;
    font-weight: 800;
    color: #10b981;
    margin: 12px 0 4px 0;
  }
  .cta-btn {
    display: block;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #020617 !important;
    font-weight: 700;
    font-size: 14px;
    padding: 14px 24px;
    border-radius: 12px;
    text-decoration: none;
    margin: 28px 0 12px 0;
  }
  .footer {
    padding: 24px 32px;
    border-top: 1px solid #1e293b;
    background-color: #020617;
    text-align: center;
    font-size: 11px;
    color: #64748b;
    line-height: 1.6;
  }
  .footer a {
    color: #10b981;
    text-decoration: none;
  }
`;

function wrapTemplate(title: string, badgeHtml: string, bodyContent: string, actionUrl: string = 'https://app.flyemass.com', actionText: string = 'Open FlyeMass Mobile Vault'): string {
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo-title">FlyeMass</h1>
        <div class="logo-badge">Cross-Border Trade & Financial Vault</div>
      </div>
      <div class="content">
        ${badgeHtml}
        <h2 class="title">${title}</h2>
        ${bodyContent}
        <a href="${actionUrl}" class="cta-btn" target="_blank">${actionText}</a>
      </div>
      <div class="footer">
        <p>This automated transaction notification was dispatched securely by FlyeMass Financial Systems.<br/>
        CAC / CBN / SAFE Compliant • General Ledger Verified</p>
        <p style="margin-top: 8px;">
          Need assistance? Contact your 24/7 Trade Concierge via the FlyeMass app or email <a href="mailto:support@flyemass.com">support@flyemass.com</a>.
        </p>
        <p style="margin-top: 12px; font-size: 10px; color: #475569;">
          © ${currentYear} FlyeMass Logistics & Financial Services Ltd. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateAccountWelcomeEmail(recipient: EmailRecipient): EmailRenderResult {
  const flyeTag = recipient.flyeTag || 'FM-USR-8924';
  const subject = `Welcome to FlyeMass, ${recipient.name} — Your Shipping Mark is ${flyeTag}`;
  const badge = `<div class="badge badge-emerald">Account Activated • Tier 1 Verified</div>`;

  const body = `
    <p class="lead">
      Welcome aboard, <strong>${recipient.name}</strong>! Your FlyeMass cross-border mobile vault is officially active. You now have instant access to wholesale NGN-RMB-USD FX swaps, direct factory payouts in China via Alipay/WeChat, and express air & sea cargo forwarding.
    </p>

    <div class="data-card">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 700; margin-bottom: 12px;">
        Your Permanent FlyeTag & Shipping Mark
      </div>
      <div style="font-size: 26px; font-family: monospace; font-weight: 800; color: #34d399; letter-spacing: 1px;">
        ${flyeTag}
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">
        Always instruct your Chinese suppliers to write this mark clearly on all carton boxes so our dock scanners automatically route packages to your dashboard.
      </p>
    </div>

    <div class="data-card">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 700; margin-bottom: 8px;">
        Guangzhou Receiving Warehouse Address
      </div>
      <div style="font-size: 12px; line-height: 1.5; color: #f1f5f9; font-family: monospace;">
        收件仓库: FlyeMass Warehouse (Attn: ${recipient.name} - ${flyeTag})<br/>
        收件人: 陈伟 (Chen Wei)<br/>
        电话: +86 138 2449 8812<br/>
        地址: 广东省广州市白云区石井国际物流园B栋302室<br/>
        进仓唛头: FM / ${flyeTag} / ${recipient.name}
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, 'https://app.flyemass.com/profile', 'View Account & Warehouse Details'),
    text: `Welcome to FlyeMass, ${recipient.name}! Your Shipping Mark is ${flyeTag}. Guangzhou warehouse: 广东省广州市白云区石井国际物流园B栋302室.`,
    eventType: 'ACCOUNT_WELCOME'
  };
}

export function generateWalletFundingEmail(recipient: EmailRecipient, payload: {
  amount: number;
  currency: 'NGN' | 'USD' | 'CNY';
  method: string;
  reference: string;
  updatedBalance: number;
  isManualPending?: boolean;
}): EmailRenderResult {
  const isUsdWire = payload.currency === 'USD' && payload.isManualPending;
  const currSym = payload.currency === 'USD' ? '$' : payload.currency === 'NGN' ? '₦' : '¥';
  const formattedAmt = `${currSym}${payload.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedBal = `${currSym}${payload.updatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const subject = isUsdWire 
    ? `USD Wire Deposit Submitted (${formattedAmt}) — Ref: ${payload.reference}`
    : `Wallet Credited: ${formattedAmt} received in your ${payload.currency} Vault`;

  const badge = isUsdWire
    ? `<div class="badge badge-amber">Wire Receipt Under Review</div>`
    : `<div class="badge badge-emerald">Payment Cleared & Credited</div>`;

  const leadText = isUsdWire
    ? `Your manual international bank wire transfer receipt of <strong>${formattedAmt}</strong> has been submitted. Our compliance team is verifying the proof of payment with JPMorgan Chase.`
    : `We have successfully confirmed your automated deposit of <strong>${formattedAmt}</strong> via <strong>${payload.method}</strong>. Your multi-currency vault has been updated.`;

  const body = `
    <p class="lead">${leadText}</p>
    
    <div class="data-card">
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">Amount Deposited</span>
        <div class="amount-highlight">${formattedAmt}</div>
      </div>
      
      <div class="data-row">
        <span class="data-label">Destination Vault:</span>
        <span class="data-value">${payload.currency} Corporate Vault</span>
      </div>
      <div class="data-row">
        <span class="data-label">Payment Channel:</span>
        <span class="data-value">${payload.method}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Transaction Reference:</span>
        <span class="data-value" style="font-family: monospace;">${payload.reference}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Timestamp:</span>
        <span class="data-value">${new Date().toLocaleString()} WAT</span>
      </div>
      <div class="data-row">
        <span class="data-label">Updated Balance:</span>
        <span class="data-value" style="color: #34d399;">${formattedBal}</span>
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, 'https://app.flyemass.com/wallets', 'View Multi-Currency Vault'),
    text: `${subject}: ${formattedAmt} via ${payload.method}. Reference: ${payload.reference}. Updated balance: ${formattedBal}.`,
    eventType: 'WALLET_FUNDING'
  };
}

export function generateFxSwapEmail(recipient: EmailRecipient, payload: {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  reference: string;
}): EmailRenderResult {
  const fromSym = payload.fromCurrency === 'NGN' ? '₦' : payload.fromCurrency === 'USD' ? '$' : '¥';
  const toSym = payload.toCurrency === 'CNY' ? '¥' : payload.toCurrency === 'USD' ? '$' : '₦';
  const debitedStr = `${fromSym}${payload.fromAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const creditedStr = `${toSym}${payload.toAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const subject = `Instant FX Swap Receipt: Swapped ${debitedStr} to ${creditedStr} (Ref: ${payload.reference})`;
  const badge = `<div class="badge badge-emerald">FX Swap Cleared • Zero Slippage</div>`;

  const body = `
    <p class="lead">
      Your instant wholesale FX swap from <strong>${payload.fromCurrency}</strong> to <strong>${payload.toCurrency}</strong> has been executed successfully with zero rate slippage.
    </p>

    <div class="data-card">
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">Credited to ${payload.toCurrency} Vault</span>
        <div class="amount-highlight">${creditedStr}</div>
      </div>

      <div class="data-row">
        <span class="data-label">Debited Source Amount:</span>
        <span class="data-value" style="color: #f87171;">-${debitedStr}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Execution Exchange Rate:</span>
        <span class="data-value">₦${payload.rate.toFixed(2)} / ${payload.toCurrency}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Reference ID:</span>
        <span class="data-value" style="font-family: monospace;">${payload.reference}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Settlement Clearing:</span>
        <span class="data-value">Instant Treasury Rail</span>
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, 'https://app.flyemass.com/wallets', 'View Vault Balances'),
    text: `FX Swap Executed: ${debitedStr} -> ${creditedStr} at rate ${payload.rate}. Ref: ${payload.reference}.`,
    eventType: 'FX_SWAP'
  };
}

export function generateSupplierPayoutEmail(recipient: EmailRecipient, payload: {
  supplierName: string;
  payoutMethod: 'Alipay' | 'WeChat' | 'Bank Transfer' | string;
  amountCNY: number;
  clearingReference: string;
  beneficiaryAccount: string;
}): EmailRenderResult {
  const formattedCny = `¥${payload.amountCNY.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const subject = `China Supplier Payout Dispatched: ${formattedCny} to ${payload.supplierName}`;
  const badge = `<div class="badge badge-emerald">Merchant Clearing Confirmed</div>`;

  const body = `
    <p class="lead">
      We have processed and dispatched your supplier settlement of <strong>${formattedCny}</strong> to <strong>${payload.supplierName}</strong> via <strong>${payload.payoutMethod}</strong>.
    </p>

    <div class="data-card">
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">Amount Dispatched</span>
        <div class="amount-highlight">${formattedCny}</div>
      </div>

      <div class="data-row">
        <span class="data-label">Beneficiary Supplier:</span>
        <span class="data-value">${payload.supplierName}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Payout Channel:</span>
        <span class="data-value">${payload.payoutMethod}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Beneficiary ID / Account:</span>
        <span class="data-value" style="font-family: monospace;">${payload.beneficiaryAccount}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Merchant Clearing Ref:</span>
        <span class="data-value" style="font-family: monospace;">${payload.clearingReference}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Settlement Speed:</span>
        <span class="data-value">Real-Time (Under 90s)</span>
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, 'https://app.flyemass.com/wallets/pay-supplier', 'View Payout Receipt'),
    text: `Supplier Payout Dispatched: ${formattedCny} to ${payload.supplierName} via ${payload.payoutMethod}. Ref: ${payload.clearingReference}.`,
    eventType: 'SUPPLIER_PAYOUT'
  };
}

export function generateCargoReceivedEmail(recipient: EmailRecipient, payload: {
  waybillNumber: string;
  warehouseLocation: string;
  cartonCount: number;
  weightKg: number;
  cbmVolume?: number;
  destination: string;
}): EmailRenderResult {
  const subject = `Cargo Received at Warehouse: ${payload.waybillNumber} (${payload.cartonCount} Cartons / ${payload.weightKg}kg)`;
  const badge = `<div class="badge badge-indigo">Warehouse Intake Scan Complete</div>`;

  const body = `
    <p class="lead">
      Our dock receiving staff has scanned and accepted your shipment at the <strong>${payload.warehouseLocation}</strong> under your shipping mark <strong>${recipient.flyeTag || 'FM-USR-8924'}</strong>.
    </p>

    <div class="data-card">
      <div style="text-align: center; margin-bottom: 12px;">
        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px;">Consignment Waybill</span>
        <div style="font-size: 22px; font-weight: 800; font-family: monospace; color: #38bdf8; margin-top: 4px;">
          ${payload.waybillNumber}
        </div>
      </div>

      <div class="data-row">
        <span class="data-label">Receiving Hub:</span>
        <span class="data-value">${payload.warehouseLocation}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Carton Pieces:</span>
        <span class="data-value">${payload.cartonCount} Cartons</span>
      </div>
      <div class="data-row">
        <span class="data-label">Gross Verified Weight:</span>
        <span class="data-value">${payload.weightKg} kg</span>
      </div>
      ${payload.cbmVolume ? `
      <div class="data-row">
        <span class="data-label">Volumetric Measurement:</span>
        <span class="data-value">${payload.cbmVolume} CBM</span>
      </div>` : ''}
      <div class="data-row">
        <span class="data-label">Destination Corridor:</span>
        <span class="data-value">${payload.destination}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Next Step:</span>
        <span class="data-value">Customs Documentation & Air Freight Loading</span>
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, `https://app.flyemass.com/shipments/track?code=${payload.waybillNumber}`, 'Track Package Live'),
    text: `Cargo Received: ${payload.waybillNumber} at ${payload.warehouseLocation}. ${payload.cartonCount} cartons, ${payload.weightKg}kg. Next: Customs & Freight Loading.`,
    eventType: 'CARGO_RECEIVED'
  };
}

export function generateShopOrderEmail(recipient: EmailRecipient, payload: {
  orderId: string;
  productTitle: string;
  variant: string;
  amountUSD: number;
  deliveryAddress: string;
  imeiWarranty?: string;
}): EmailRenderResult {
  const formattedUsd = `$${payload.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const subject = `Order Confirmed: ${payload.productTitle} (${payload.orderId})`;
  const badge = `<div class="badge badge-emerald">Paid via Wallet Vault • Preparing Dispatch</div>`;

  const body = `
    <p class="lead">
      Thank you for ordering with the FlyeMass Tech Shop! Your payment of <strong>${formattedUsd}</strong> has been debited and your pristine factory-sealed device has been reserved.
    </p>

    <div class="data-card">
      <div class="data-row">
        <span class="data-label">Order Number:</span>
        <span class="data-value" style="font-family: monospace;">${payload.orderId}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Product Item:</span>
        <span class="data-value">${payload.productTitle}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Selected Variant:</span>
        <span class="data-value">${payload.variant}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Total Amount:</span>
        <span class="data-value" style="color: #34d399;">${formattedUsd}</span>
      </div>
      ${payload.imeiWarranty ? `
      <div class="data-row">
        <span class="data-label">IMEI / Warranty:</span>
        <span class="data-value" style="font-family: monospace;">${payload.imeiWarranty}</span>
      </div>` : ''}
      <div class="data-row">
        <span class="data-label">Delivery Destination:</span>
        <span class="data-value">${payload.deliveryAddress}</span>
      </div>
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, 'https://app.flyemass.com/shop', 'Track Tech Order'),
    text: `Order Confirmed: ${payload.productTitle} (${payload.orderId}) for ${formattedUsd}. Delivery: ${payload.deliveryAddress}.`,
    eventType: 'SHOP_ORDER'
  };
}

export function generateSupportTicketEmail(recipient: EmailRecipient, payload: {
  ticketNumber: string;
  subject: string;
  status: string;
  assignedAgent?: string;
  latestMessageSnippet?: string;
}): EmailRenderResult {
  const subject = `[Ticket ${payload.ticketNumber}] Status Update: ${payload.status}`;
  const badge = payload.status.includes('Review') || payload.status.includes('Escalate')
    ? `<div class="badge badge-amber">${payload.status}</div>`
    : `<div class="badge badge-indigo">${payload.status}</div>`;

  const body = `
    <p class="lead">
      Your support inquiry <strong>${payload.ticketNumber}</strong> has an active update from the FlyeMass Trade Concierge desk.
    </p>

    <div class="data-card">
      <div class="data-row">
        <span class="data-label">Ticket ID:</span>
        <span class="data-value" style="font-family: monospace;">${payload.ticketNumber}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Inquiry Subject:</span>
        <span class="data-value">${payload.subject}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Current Status:</span>
        <span class="data-value" style="color: #38bdf8;">${payload.status}</span>
      </div>
      ${payload.assignedAgent ? `
      <div class="data-row">
        <span class="data-label">Assigned Trade Officer:</span>
        <span class="data-value">${payload.assignedAgent}</span>
      </div>` : ''}
      ${payload.latestMessageSnippet ? `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #0f172a;">
        <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Latest Message:</span>
        <p style="font-size: 12px; color: #e2e8f0; line-height: 1.5; margin: 6px 0 0 0;">
          "${payload.latestMessageSnippet}"
        </p>
      </div>` : ''}
    </div>
  `;

  return {
    subject,
    html: wrapTemplate(subject, badge, body, `https://app.flyemass.com/profile/support-chat?ticketId=${payload.ticketNumber}`, 'Reply in Live Concierge Chat'),
    text: `Support Ticket ${payload.ticketNumber} status: ${payload.status}. Subject: ${payload.subject}.`,
    eventType: 'SUPPORT_TICKET'
  };
}

export function renderTransactionalEmail(
  eventType: TransactionalEmailEvent,
  recipient: EmailRecipient,
  payload: any = {}
): EmailRenderResult {
  switch (eventType) {
    case 'ACCOUNT_WELCOME':
      return generateAccountWelcomeEmail(recipient);
    case 'WALLET_FUNDING':
      return generateWalletFundingEmail(recipient, payload);
    case 'FX_SWAP':
      return generateFxSwapEmail(recipient, payload);
    case 'SUPPLIER_PAYOUT':
      return generateSupplierPayoutEmail(recipient, payload);
    case 'CARGO_RECEIVED':
      return generateCargoReceivedEmail(recipient, payload);
    case 'SHOP_ORDER':
      return generateShopOrderEmail(recipient, payload);
    case 'SUPPORT_TICKET':
      return generateSupportTicketEmail(recipient, payload);
    default:
      return {
        subject: `FlyeMass Notification: ${eventType}`,
        html: wrapTemplate(`FlyeMass Notification: ${eventType}`, '<div class="badge badge-emerald">Notice</div>', `<p class="lead">${payload?.message || 'New account activity recorded.'}</p>`),
        text: `FlyeMass Notification: ${payload?.message || eventType}`,
        eventType
      };
  }
}

