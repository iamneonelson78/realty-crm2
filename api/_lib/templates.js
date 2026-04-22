// Inline-CSS HTML email templates. Intentionally small — three templates total.
// Keep in sync with the brand colors used in src/components/Logo.jsx and Tailwind's
// `brand` palette: brand-600 = #0891B2 (cyan-ish), slate text.
//
// Every template returns { subject, html } so route handlers can spread into
// sendEmail() directly.

const BRAND = '#0891B2';
const BRAND_DARK = '#0E7490';
const TEXT = '#0F172A';
const MUTED = '#475569';
const BORDER = '#E2E8F0';
const BG = '#F8FAFC';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell({ title, intro, bodyHtml, ctaText, ctaUrl, footerNote }) {
  const cta = ctaText && ctaUrl
    ? `
      <tr><td style="padding:8px 0 24px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">
          ${escapeHtml(ctaText)}
        </a>
      </td></tr>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:20px;font-weight:800;letter-spacing:-0.01em;">
            Realty <span style="color:${BRAND_DARK};">CRM</span>
          </div>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:${TEXT};">${escapeHtml(title)}</h1>
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:${MUTED};">${intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${bodyHtml || ''}
            ${cta}
          </table>
          ${footerNote ? `<p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:${MUTED};">${footerNote}</p>` : ''}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid ${BORDER};background:${BG};">
          <p style="margin:0;font-size:11px;color:${MUTED};">Sent by Realty CRM &middot; Powered by Corevia Technologies</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Admin gets this when a new agent signs up.
 */
export function adminNewSignupEmail({ name, email, approveUrl }) {
  const safeName = escapeHtml(name || 'New user');
  const safeEmail = escapeHtml(email || '(email not on file)');
  return {
    subject: `New signup awaiting approval: ${name || email || 'a new user'}`,
    html: shell({
      title: 'New signup awaiting approval',
      intro: 'A new agent has requested access to Realty CRM. Review their profile and approve or suspend them from the Admin dashboard.',
      bodyHtml: `
        <tr><td style="padding:14px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;">
            <tr><td style="padding:12px 14px;font-size:13px;color:${MUTED};">Name</td>
                <td style="padding:12px 14px;font-size:13px;color:${TEXT};font-weight:600;text-align:right;">${safeName}</td></tr>
            <tr><td style="padding:12px 14px;font-size:13px;color:${MUTED};border-top:1px solid ${BORDER};">Email</td>
                <td style="padding:12px 14px;font-size:13px;color:${TEXT};font-weight:600;text-align:right;border-top:1px solid ${BORDER};">${safeEmail}</td></tr>
          </table>
        </td></tr>`,
      ctaText: approveUrl ? 'Review in Admin' : null,
      ctaUrl: approveUrl || null,
      footerNote: 'If this was unexpected, suspend the account and investigate.',
    }),
  };
}

/**
 * User gets this when an admin flips their status from pending -> active.
 */
export function userApprovedEmail({ name, loginUrl }) {
  const safeName = escapeHtml(name || 'there');
  return {
    subject: 'Your Realty CRM account is approved',
    html: shell({
      title: `You're in, ${safeName}!`,
      intro: 'Your Realty CRM account has been approved. You can now log in and start managing your pipeline.',
      ctaText: 'Log in to Realty CRM',
      ctaUrl: loginUrl,
      footerNote: 'If you did not request this account, please ignore this email or reply to let us know.',
    }),
  };
}

/**
 * User gets this when they click "Forgot password" (triggered by the Supabase
 * Send Email Hook for email_action_type === 'recovery').
 */
export function passwordResetEmail({ resetUrl }) {
  return {
    subject: 'Reset your Realty CRM password',
    html: shell({
      title: 'Reset your password',
      intro: 'We received a request to reset the password on your Realty CRM account. Click the button below to choose a new one. This link expires in one hour.',
      ctaText: 'Reset password',
      ctaUrl: resetUrl,
      footerNote: `If you didn't request a reset, you can safely ignore this email — your password won't change until you click the link and pick a new one.`,
    }),
  };
}
