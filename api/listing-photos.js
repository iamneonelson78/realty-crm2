/**
 * POST /api/listing-photos
 *
 * Uploads photos for a specific listing to Google Drive.
 * Requires a valid Supabase bearer token (authenticated agents only).
 *
 * Body (JSON): {
 *   listingId: string,
 *   files: [{ name, mime, data }]   // base64-encoded file content
 * }
 *
 * Returns: [{ drive_file_id, name, mimeType, size, web_view_link }]
 *
 * DELETE /api/listing-photos
 * Body: { listingId, driveFileId }
 * Deletes a photo from Drive and removes it from listings.photo_urls.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GDRIVE_LISTINGS_FOLDER_ID = process.env.GDRIVE_LISTINGS_FOLDER_ID;

export default async function handler(req, res) {
  // Auth: verify the Supabase JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Verify caller identity
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const body = req.body || {};

  // ── POST: upload photos ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { listingId, files } = body;

    if (!listingId || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'listingId and files[] are required' });
    }

    // Verify the listing belongs to the caller
    const { data: listing } = await supabase
      .from('listings')
      .select('id, agent_id, photo_urls')
      .eq('id', listingId)
      .single();

    if (!listing || listing.agent_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!GDRIVE_LISTINGS_FOLDER_ID) {
      return res.status(503).json({ error: 'Google Drive not configured (GDRIVE_LISTINGS_FOLDER_ID missing)' });
    }

    const { uploadToDrive } = await import('./_lib/drive.js');
    const uploaded = [];

    for (const file of files.slice(0, 5)) {
      if (!file?.data || !file?.name) continue;
      const buffer = Buffer.from(file.data, 'base64');
      const result = await uploadToDrive({
        parentFolderId: GDRIVE_LISTINGS_FOLDER_ID,
        subfolderName: listingId,
        file: { name: file.name, mime: file.mime || 'image/jpeg', buffer },
      });
      uploaded.push(result);
    }

    // Merge with existing photo_urls
    const existing = Array.isArray(listing.photo_urls) ? listing.photo_urls : [];
    const merged = [...existing, ...uploaded];

    const { error: updateError } = await supabase
      .from('listings')
      .update({ photo_urls: merged })
      .eq('id', listingId);

    if (updateError) {
      return res.status(500).json({ error: `Failed to update listing: ${updateError.message}` });
    }

    return res.status(200).json(uploaded);
  }

  // ── DELETE: remove a photo ───────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { listingId, driveFileId } = body;

    if (!listingId || !driveFileId) {
      return res.status(400).json({ error: 'listingId and driveFileId are required' });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('id, agent_id, photo_urls')
      .eq('id', listingId)
      .single();

    if (!listing || listing.agent_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Remove from Drive
    if (GDRIVE_LISTINGS_FOLDER_ID) {
      try {
        const { deleteFromDrive } = await import('./_lib/drive.js');
        await deleteFromDrive(driveFileId);
      } catch (err) {
        console.warn('Drive delete failed:', err.message);
      }
    }

    // Remove from photo_urls array
    const remaining = (listing.photo_urls || []).filter((p) => p.drive_file_id !== driveFileId);
    await supabase.from('listings').update({ photo_urls: remaining }).eq('id', listingId);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
