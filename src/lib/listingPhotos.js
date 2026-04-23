/**
 * listingPhotos.js
 *
 * Client-side helpers for the /api/listing-photos serverless route.
 * Requires a valid Supabase session (the JWT is forwarded as Bearer token).
 */

import { supabase } from './supabaseClient';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return token;
}

/**
 * Convert a File to base64 string.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // strip data-url prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload one or more File objects for a listing.
 * Returns the newly uploaded photo objects from Drive.
 */
export async function uploadListingPhotos(listingId, files) {
  const token = await getToken();

  const encoded = await Promise.all(
    Array.from(files).map(async (f) => ({
      name: f.name,
      mime: f.type || 'image/jpeg',
      data: await fileToBase64(f),
    })),
  );

  const res = await fetch('/api/listing-photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ listingId, files: encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  return res.json(); // array of photo objects
}

/**
 * Delete a single photo by its Drive file ID.
 */
export async function deleteListingPhoto(listingId, driveFileId) {
  const token = await getToken();

  const res = await fetch('/api/listing-photos', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ listingId, driveFileId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete failed (${res.status})`);
  }
}
