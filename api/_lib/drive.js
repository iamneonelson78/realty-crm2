/**
 * Google Drive upload wrapper using a service account.
 *
 * Requires environment variable:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  — full JSON key file content as a single-line string
 *   (set via Vercel env vars, marked Sensitive)
 *
 * The service account needs "Editor" access to the target Drive folders.
 * Scope used: https://www.googleapis.com/auth/drive.file
 *   (only files created by this app — not the user's whole Drive)
 *
 * @see docs/GOOGLE_DRIVE_SETUP.md
 */

import { google } from 'googleapis';
import { Readable } from 'stream';

let _auth = null;

function getAuth() {
  if (_auth) return _auth;

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set. See docs/GOOGLE_DRIVE_SETUP.md');
  }

  let credentials;
  try {
    credentials = JSON.parse(keyJson);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON. Paste the full JSON key file content.');
  }

  _auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return _auth;
}

// In-memory subfolder cache: Map<`${parentId}/${name}`, folderId>
const folderCache = new Map();

/**
 * Get or create a subfolder under the given parent folder.
 * Cached in-memory to avoid redundant Drive API calls within the same process.
 */
async function getOrCreateSubfolder(drive, parentFolderId, subfolderName) {
  const cacheKey = `${parentFolderId}/${subfolderName}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey);

  // Search for existing folder
  const search = await drive.files.list({
    q: `name='${subfolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  let folderId;
  if (search.data.files?.length > 0) {
    folderId = search.data.files[0].id;
  } else {
    const created = await drive.files.create({
      requestBody: {
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });
    folderId = created.data.id;
  }

  folderCache.set(cacheKey, folderId);
  return folderId;
}

/**
 * Upload a file to Google Drive under the given parent folder, in a subfolder.
 *
 * @param {Object} params
 * @param {string} params.parentFolderId  Drive folder ID (from env var)
 * @param {string} params.subfolderName   Subfolder name, e.g. the feedback/listing ID
 * @param {Object} params.file            { name: string, mime: string, buffer: Buffer }
 * @returns {Promise<{ drive_file_id, name, mimeType, size, web_view_link, web_content_link }>}
 */
export async function uploadToDrive({ parentFolderId, subfolderName, file }) {
  if (!parentFolderId) {
    throw new Error('parentFolderId is required (set the appropriate GDRIVE_*_FOLDER_ID env var)');
  }

  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Get or create subfolder
  const subfolderId = await getOrCreateSubfolder(drive, parentFolderId, subfolderName);

  // Upload file
  const stream = Readable.from(file.buffer);
  const uploaded = await drive.files.create({
    requestBody: {
      name: file.name,
      mimeType: file.mime,
      parents: [subfolderId],
    },
    media: {
      mimeType: file.mime,
      body: stream,
    },
    fields: 'id,name,mimeType,size,webViewLink,webContentLink',
  });

  const f = uploaded.data;

  // Make publicly readable so the web_view_link works for admins/agents
  await drive.permissions.create({
    fileId: f.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return {
    drive_file_id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size ? Number(f.size) : null,
    web_view_link: f.webViewLink,
    web_content_link: f.webContentLink,
  };
}

/**
 * Delete a file from Google Drive by its Drive file ID.
 * @param {string} fileId
 */
export async function deleteFromDrive(fileId) {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });
  await drive.files.delete({ fileId });
}
