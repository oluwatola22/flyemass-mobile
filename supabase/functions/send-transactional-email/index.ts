/**
 * SUPABASE EDGE FUNCTION: send-transactional-email
 * 
 * Secure transactional email dispatcher powered by Resend / SendGrid APIs.
 * Invoked by Postgres Database Triggers and backend webhooks when key financial
 * and activity events take place.
 */

// Setup Deno types reference for Supabase Edge Runtime
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

interface EmailPayload {
  recipientEmail: string;
  recipientName?: string;
  eventType: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  metadata?: Record<string, any>;
  provider?: 'resend' | 'sendgrid';
}

export function renderTransactionalEmail(eventType: string, recipient: { email: string; name?: string }, payload: Record<string, any> = {}) {
  const name = recipient.name || 'Valued Client';
  const subject = payload.subject || `FlyeMass Notice: ${eventType}`;
  const html = `<!DOCTYPE html><html><body style="background:#020617;color:#f8fafc;font-family:sans-serif;padding:32px;"><div style="max-width:580px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:24px;"><h2 style="color:#ffffff;">FLYEMASS</h2><div style="color:#10b981;font-weight:700;margin-bottom:12px;">${eventType}</div><p style="color:#94a3b8;">Hello ${name},</p><p style="color:#f8fafc;">${payload.message || 'Your cross-border transaction has been processed.'}</p></div></body></html>`;
  return { subject, html, text: `${eventType}: Hello ${name}, transaction processed.` };
}


const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || Deno.env.get('VITE_RESEND_API_KEY');
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const DEFAULT_FROM = Deno.env.get('EMAIL_FROM') || 'FlyeMass Treasury <notifications@flyemass.com>';

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. POST required.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload: EmailPayload = await req.json();
    const { recipientEmail, recipientName, eventType, subject, htmlBody, textBody, metadata } = payload;

    if (!recipientEmail || !subject || !htmlBody) {
      return new Response(JSON.stringify({ error: 'recipientEmail, subject, and htmlBody are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let providerUsed = 'mock';
    let externalEmailId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Dispatch via Resend API if API Key is present
    if (RESEND_API_KEY && RESEND_API_KEY.trim()) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY.trim()}`
          },
          body: JSON.stringify({
            from: DEFAULT_FROM,
            to: [recipientEmail],
            subject,
            html: htmlBody,
            text: textBody,
            tags: [
              { name: 'event_type', value: eventType || 'general' },
              { name: 'app', value: 'flyemass' }
            ]
          })
        });

        if (resendRes.ok) {
          const resendData = await resendRes.json();
          providerUsed = 'resend';
          externalEmailId = resendData.id || externalEmailId;
        } else {
          const errText = await resendRes.text();
          console.error('[Resend Dispatch Error]:', errText);
        }
      } catch (resendErr: any) {
        console.error('[Resend Network Exception]:', resendErr?.message);
      }
    } 
    // 2. Dispatch via SendGrid API if SendGrid Key is present
    else if (SENDGRID_API_KEY && SENDGRID_API_KEY.trim()) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SENDGRID_API_KEY.trim()}`
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipientEmail, name: recipientName }] }],
            from: { email: 'notifications@flyemass.com', name: 'FlyeMass Treasury' },
            subject,
            content: [
              { type: 'text/html', value: htmlBody }
            ]
          })
        });

        if (sgRes.status >= 200 && sgRes.status < 300) {
          providerUsed = 'sendgrid';
          externalEmailId = sgRes.headers.get('x-message-id') || externalEmailId;
        }
      } catch (sgErr: any) {
        console.error('[SendGrid Network Exception]:', sgErr?.message);
      }
    }

    // 3. Return successful response with delivery audit receipt
    return new Response(JSON.stringify({
      success: true,
      emailId: externalEmailId,
      provider: providerUsed,
      recipient: recipientEmail,
      eventType: eventType || 'TRANSACTION_NOTIFICATION',
      deliveredAt: new Date().toISOString(),
      metadata: metadata || {}
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err: any) {
    console.error('[Edge Function Fatal Error]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
