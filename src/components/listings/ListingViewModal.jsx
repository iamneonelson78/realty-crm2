/**
 * ListingViewModal.jsx — read-only listing details overlay
 */

import { X, ExternalLink, Image } from 'lucide-react';

const STATUS_COLOR = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  reserved:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  rented:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  archived:  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function ListingViewModal({ listing, onClose, onEdit }) {
  if (!listing) return null;
  const photos = Array.isArray(listing.photo_urls) ? listing.photo_urls : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{listing.title}</h2>
            {listing.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[listing.status] || STATUS_COLOR.archived}`}>
                {listing.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Photos */}
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p) => (
                <a key={p.drive_file_id} href={p.web_view_link} target="_blank" rel="noreferrer" className="flex-shrink-0">
                  <img
                    src={p.web_content_link}
                    alt={p.name}
                    className="h-28 w-40 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </a>
              ))}
            </div>
          )}
          {photos.length === 0 && (
            <div className="flex items-center justify-center h-20 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-gray-400">
              <Image className="w-6 h-6 mr-2" />
              <span className="text-sm">No photos</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Detail label="Category" value={listing.category} />
            <Detail label="Location" value={listing.location} />
            <Detail label="Rent" value={listing.rent ? `PHP ${Number(listing.rent).toLocaleString()}/mo` : undefined} />
            <Detail label="Bedrooms" value={listing.beds} />
            <Detail label="Bathrooms" value={listing.bathrooms} />
            <Detail label="Floor Area" value={listing.floor_area ? `${listing.floor_area} sqm` : undefined} />
          </div>

          {listing.description && <Detail label="Description" value={listing.description} block />}
          {listing.amenities    && <Detail label="Amenities" value={listing.amenities} block />}
          {listing.rules        && <Detail label="Rules / Terms" value={listing.rules} block />}
          {listing.contact      && <Detail label="Contact" value={listing.contact} block />}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Close
          </button>
          {onEdit && (
            <button onClick={onEdit} className="px-5 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium">
              Edit Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, block }) {
  if (!value && value !== 0) return null;
  return (
    <div className={block ? 'col-span-2' : ''}>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
