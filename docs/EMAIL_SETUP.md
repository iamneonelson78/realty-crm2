# Email setup — Resend + Supabase + Vercel

This app sends three transactional emails via **Resend**:

1. **Admin notification** when someone signs up (to `ADMIN_EMAIL`).
2. **"You've been approved"** email to the user when an admin activates them.
3. **Password reset** email when someone clicks "Forgot password?".

Emails (1) and (2) are triggered by the app calling our own serverless functions. Email (3) is triggered by Supabase's **Send Email Hook** so we can reuse Supabase's secure token generation without paying for Supabase's SMTP tier.

There's no outbound email from localhost — Supabase's hook can only reach a public URL, so do all testing on the deployed Vercel domain.

---

## 0. What you need before starting

- A **Resend** account (free tier is fine — 100 emails/day, 3,000/month).
- Admin access to the **DNS** of `getcoreviatechnologies.com` (or whatever domain you'll send from).
- Owner/maintainer access to the **Supabase** project (`dhfjmbqljsqkgixbkgkd`).
- Admin access to the **Vercel** project this app deploys to.

You'll end up with seven new environment variables set in Vercel and one hook configured in Supabase.

---

## 1. Resend — verify your sending domain

1. Go to https://resend.com → sign up / log in.
2. **Domains → Add Domain** → enter `getcoreviatechnologies.com`. Choose the region closest to your users (US by default is fine).
3. Resend shows a list of DNS records — usually:
   - 1× `MX` (bounce tracking, subdomain like `send.getcoreviatechnologies.com`)
   - 1× `TXT` SPF (`v=spf1 include:amazonses.com ~all` or similar)
   - 2× `CNAME` DKIM (`resend._domainkey...`)
   - 1× `TXT` DMARC (if not already present)
4. Add **each of those records exactly** in your DNS provider (GoDaddy / Namecheap / Cloudflare / wherever `getcoreviatechnologies.com` is registered). Don't change any values — paste them as shown.
5. Back in Resend, click **Verify DNS Records**. It can take anywhere from 5 minutes to a few hours for DNS to propagate. Wait until every row shows a green "Verified" checkmark. **Do not proceed until the domain is fully verified**, or all email sends will fail with a 403.
6. Once verified, go to **API Keys → Create API Key**:
   - Name: `Realty CRM production`
   - Permission: **Sending access** (not Full access — principle of least privilege).
   - Domain: restrict to `getcoreviatechnologies.com`.
   - Copy the generated key (starts with `re_`). You'll only see it once.

---

## 2. Vercel — set environment variables

Open your Vercel project → **Settings → Environment Variables**. Add each row below. For every var, check **Production**, **Preview**, and **Development** unless noted.

| Name | Value | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` (from step 1.6) | **Sensitive** — treat like a password. |
| `FROM_EMAIL` | `Realty CRM <noreply@getcoreviatechnologies.com>` | Must match the verified domain. The "friendly name" before `<>` is optional but recommended. |
| `SUPABASE_URL` | `https://dhfjmbqljsqkgixbkgkd.supabase.co` | Same as `VITE_SUPABASE_URL` but without the `VITE_` prefix. |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Dashboard → **Project Settings → API → `service_role` key**. **Sensitive — never commit, never expose to browser.** |
| `SEND_EMAIL_HOOK_SECRET` | `v1,whsec_...` | Set in step 3 below — come back and fill this in. |
| `ADMIN_EMAIL` | `admin@getcoreviatechnologies.com` | Who gets notified when a new user signs up. Change to whichever inbox you actually monitor. |
| `APP_URL` | `https://realty-crm2.vercel.app` (or your custom domain) | Used to build the links inside outbound emails. No trailing slash. |

The existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` stay as they are — those are the browser-side keys.

After adding them, **redeploy** (Vercel → Deployments → latest → **⋯ → Redeploy**) so the new env vars are picked up by the serverless functions.

---

## 3. Supabase — configure the Send Email Hook

1. Open the Supabase dashboard for project `dhfjmbqljsqkgixbkgkd`.
2. Go to **Authentication → Hooks** (left sidebar).
3. Find the **Send Email Hook** row → click **Enable**.
4. Select **HTTPS** as the hook type.
5. **Hook URL**: `https://<your-vercel-domain>/api/auth-email-hook`
   - Use your real domain — localhost won't work.
   - Example: `https://realty-crm2.vercel.app/api/auth-email-hook`
6. Click **Generate secret**. A value starting with `v1,whsec_...` appears — **copy it immediately** (you won't see it again).
7. Back in Vercel, paste that value into the `SEND_EMAIL_HOOK_SECRET` env var from step 2, then **redeploy**.

### 3a. Add the reset URL as an allowed redirect

Still in Supabase: **Authentication → URL Configuration**.

- **Site URL**: `https://<your-vercel-domain>` (your production URL, no trailing slash).
- **Redirect URLs**: add an entry for `https://<your-vercel-domain>/reset-password`. This is the page the reset link points at — Supabase refuses to issue recovery tokens for URLs not on this allowlist.

If you also use the app from a custom domain (e.g. `app.getcoreviatechnologies.com`), add a second redirect URL for that as well.

### 3b. Turn off Supabase's built-in "Confirm email" (optional but recommended)

**Authentication → Providers → Email**. Disable **Confirm email** — our product uses admin approval, not email confirmation. If this is left on, users won't be able to log in until they click a Supabase-generated confirmation link, which we aren't sending through our hook.

---

## 4. Deploy and smoke-test

Push your code, wait for the Vercel deploy to go green, then run through each flow on the live URL:

### Forgot password (the critical path)

1. Open `https://<vercel-domain>/login` → click **Forgot password?** → enter a registered user's email → submit.
2. In the Supabase dashboard, **Logs → Auth logs** — you should see a `send_email` event with status 200.
3. In Vercel, **Functions → auth-email-hook → Logs** — you should see the request and no errors.
4. In Resend, **Emails** tab — one entry in "Delivered" state, addressed to the user.
5. Open the email → click **Reset password** → land on `/reset-password?token_hash=...`. Enter a new password, confirm → you should be redirected to `/login` with a success toast. Log in with the new password.

### Signup → admin notification

1. Sign up as a new agent at `/signup`.
2. Within ~10s, `ADMIN_EMAIL`'s inbox has the "New signup awaiting approval" email.
3. In Vercel → **Functions → notify-admin-signup → Logs** — 200.

### Admin approval → user notification

1. Log in as admin → **Admin → Access Control** → find the pending user → open the edit drawer → click **Active**.
2. The agent's inbox receives "Your Realty CRM account is approved".
3. Vercel logs for `notify-user-approved` show 200. If you see 401/403, confirm the acting admin's profile has `role=admin` and `status=active` in the DB.

### Security checks

- `curl -X POST https://<vercel-domain>/api/auth-email-hook -d '{}'` → must return **401** (signature missing). Confirm no Resend email was sent.
- `curl -X POST https://<vercel-domain>/api/notify-user-approved -H "Content-Type: application/json" -d '{"userId":"something"}'` → must return **401** (no bearer token).

---

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Reset email never arrives, Resend dashboard is empty | Supabase hook isn't reaching Vercel | Check Supabase **Auth Logs** — if the request is 4xx, the hook URL is wrong. If 5xx, check Vercel logs. |
| Hook returns 401 | `SEND_EMAIL_HOOK_SECRET` in Vercel doesn't match the one Supabase generated | Regenerate the secret in Supabase, copy the new value to Vercel, redeploy. |
| Resend returns 403 / "Domain not verified" | DNS isn't fully propagated | Wait and re-run verification in Resend. Can take up to 24h on slow DNS providers. |
| Reset link errors with "This reset link is invalid" | Link expired (default is 1 hour) | Request a new one. If it happens immediately, the `token_hash` isn't being passed through — check the hook URL is `/api/auth-email-hook` exactly. |
| Approval email errors with "Admin access required" | The logged-in admin's profile row has `role != 'admin'` or `status != 'active'` | Fix the row in the `profiles` table. |
| Emails are marked as spam | DMARC not set, or `FROM_EMAIL` doesn't match the verified domain | Add a DMARC record (`v=DMARC1; p=none; rua=mailto:...`) and confirm `FROM_EMAIL` domain matches what's verified in Resend. |

---

## 6. Cost and limits

- **Resend free**: 3,000 emails/month, 100/day, 1 verified domain. Plenty for early-stage usage.
- **Supabase hooks**: no extra cost, covered by free tier.
- **Vercel serverless**: 3 small functions, well within the Hobby plan's 100 GB-hour limit.

Monitor usage in the Resend dashboard. Upgrade before you hit limits.
