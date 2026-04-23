/**
 * PhotoUploader.jsx
 *
 * Reusable photo gallery + upload + delete component for listings.
 *
 * Props:
 *   listingId  – required to call the API (null/undefined = upload disabled)
 *   photos     – current photo_urls array from the listing row
 *   onChange   – called with updated photos array after upload or delete
 *   maxPhotos  – default 5
 */

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, ImageOff } from 'lucide-react';
import { uploadListingPhotos, deleteListingPhoto } from '../../lib/listingPhotos';

export default function PhotoUploader({ listingId, photos = [], onChange, maxPhotos = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const canUpload = listingId && photos.length < maxPhotos;

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !listingId) return;

    const remaining = maxPhotos - photos.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError('');
    try {
      const added = await uploadListingPhotos(listingId, toUpload);
      onChange([...photos, ...added]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(driveFileId) {
    setDeletingId(driveFileId);
    setError('');
    try {
      await deleteListingPhoto(listingId, driveFileId);
      onChange(photos.filter((p) => p.drive_file_id !== driveFileId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {/* Thumbnails grid */}
      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.drive_file_id} className="relative group">
              <a href={p.web_view_link} target="_blank" rel="noreferrer">
                <img
                  src={p.web_content_link}
                  alt={p.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </a>
              {/* Delete button */}
              {listingId && (
                <button
                  type="button"
                  onClick={() => handleDelete(p.drive_file_id)}
                  disabled={deletingId === p.drive_file_id}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60 shadow"
                  title="Remove photo"
                >
                  {deletingId === p.drive_file_id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <X className="w-3 h-3" />}
                </button>
              )}
            </div>
          ))}

          {/* Upload more slot */}
          {canUpload && (
            <UploadSlot uploading={uploading} onClick={() => inputRef.current?.click()} />
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
          <ImageOff className="w-6 h-6" />
          <span className="text-xs">No photos yet</span>
          {canUpload && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60 transition-colors"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
              {uploading ? 'Uploading…' : 'Add Photos'}
            </button>
          )}
          {!listingId && (
            <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center px-4">Save the listing first to enable photo uploads.</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleFiles}
      />
    </div>
  );
}

function UploadSlot({ uploading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading}
      className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-600 dark:hover:text-brand-400 transition-colors disabled:opacity-60"
      title="Add more photos"
    >
      {uploading
        ? <Loader2 className="w-5 h-5 animate-spin" />
        : <ImagePlus className="w-5 h-5" />}
      <span className="text-[10px]">{uploading ? 'Uploading' : 'Add'}</span>
    </button>
  );
}
