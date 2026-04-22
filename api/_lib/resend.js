// Thin wrapper around the Resend REST API.
// We use native fetch + AbortController instead of the `resend` npm package so
// there's nothing extra to install and the serverless cold start stays small.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Send a transactional email via Resend.
 * @param {{ to: string|string[], subject: string, html: string, replyTo?: string }} params
 * @returns {Promise<{ id: string }>} Resend message id on success.
 * @throws if RESEND_API_KEY/FROM_EMAIL are missing, or Resend returns non-2xx.
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  if (!from) throw new Error('FROM_EMAIL is not set');
  if (!to) throw new Error('sendEmail: `to` is required');
  if (!subject) throw new Error('sendEmail: `subject` is required');
  if (!html) throw new Error('sendEmail: `html` is required');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: controller.signal,
    });
    const bodyText = await res.text();
    if (!res.ok) {
      // Resend error shape: { name, message, statusCode }
      throw new Error(`Resend ${res.status}: ${bodyText || res.statusText}`);
    }
    try {
      return JSON.parse(bodyText);
    } catch {
      return { id: null, raw: bodyText };
    }
  } finally {
    clearTimeout(timer);
  }
}
