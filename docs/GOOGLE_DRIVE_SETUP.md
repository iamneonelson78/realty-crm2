# Google Drive Setup Guide

This guide covers the one-time setup needed to enable Google Drive integration for:

- **Feedback attachments** → `Realty CRM / Feedback Attachments / <feedback-id>/`
- **Listing photos** → `Realty CRM / Listing Photos / <listing-id>/`

A **service account** is used so uploads happen server-side only — no OAuth dance, no user consent required.

---

## Step 1 — Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g. `realty-crm`) **or** select an existing one.
3. In the left nav, go to **APIs & Services → Library**.
4. Search for **Google Drive API** and click **Enable**.

---

## Step 2 — Create a Service Account

1. Go to **APIs & Services → Credentials → Create Credentials → Service account**.
2. Name it `realty-crm-drive` (or any name you like).
3. Skip optional role/user steps and click **Done**.
4. Click the new service account → **Keys** tab → **Add Key → Create new key → JSON**.
5. Download the JSON key file. **Keep this file private — treat it like a password.**
6. Note the **service account email** (e.g. `realty-crm-drive@your-project.iam.gserviceaccount.com`).

---

## Step 3 — Create Drive Folders

1. Open [drive.google.com](https://drive.google.com) with the Google account that will own the files.
2. Create the following folder structure:

```
Realty CRM/
  Feedback Attachments/
  Listing Photos/
```

3. Right-click **Feedback Attachments** → **Share** → paste the service account email → set role to **Editor** → click **Send**.
4. Do the same for **Listing Photos**.

---

## Step 4 — Get Folder IDs

From the Drive URL when you open a folder:

```
https://drive.google.com/drive/folders/<FOLDER_ID>
```

Copy the `<FOLDER_ID>` for both folders.

---

## Step 5 — Set Vercel Environment Variables

In your Vercel project dashboard → **Settings → Environment Variables**, add:

| Variable | Value | Sensitivity |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Paste the **entire JSON key file** content as a single line | **Sensitive** |
| `GDRIVE_FEEDBACK_FOLDER_ID` | The folder ID from Step 4 | Normal |
| `GDRIVE_LISTINGS_FOLDER_ID` | The folder ID from Step 4 | Normal |

> **Tip:** To make the JSON a single line, run:
> ```bash
> cat your-key-file.json | python3 -m json.tool --compact
> ```

Apply to **Production**, **Preview**, and **Development** environments as needed.

---

## Step 6 — Verify

Deploy or redeploy the app. Then:

1. Submit feedback with an image attachment on `/login` (logged out).
2. Check the feedback row in Supabase — `attachments` JSONB should contain `{ drive_file_id, web_view_link, ... }`.
3. Open `/admin/feedback`, open the submission, and click the attachment link — it should open in Google Drive viewer.
4. Add a listing with a photo — check `listings.photo_urls` JSONB and verify the photo appears in the listing detail.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY is not set` error | Env var missing in Vercel |
| `GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON` error | The JSON wasn't pasted as a single line or was truncated |
| `403 The caller does not have permission` from Drive | Service account email not shared as Editor on the folder |
| `GDRIVE_FEEDBACK_FOLDER_ID missing` warning in logs | Env var not set; attachments are silently skipped (feedback row still saved) |
| Photos not uploading | Same as above for `GDRIVE_LISTINGS_FOLDER_ID` |

---

## Security notes

- The service account scope is `drive.file` — it can only see files **it created**. It cannot read the rest of your Drive.
- Uploaded files get a `reader/anyone` permission so the `web_view_link` works without login. Remove this permission call in `api/_lib/drive.js` if you want private-only links.
- Never commit the JSON key file to source control. It is a long-lived credential.
