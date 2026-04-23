/**
 * ListingFormModal.jsx
 *
 * Add / Edit listing form. Opens as a modal overlay.
 * On save the caller receives the listing row via onSave(row).
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { LISTING_CATEGORIES, LISTING_STATUSES } from '../../lib/listingPostTemplates';

const EMPTY = {
  title: '',
  location: '',
  rent: '',
  beds: '',
  bathrooms: '',
  floor_area: '',
  category: '',
  status: 'available',
  description: '',
  amenities: '',
  rules: '',
  contact: '',
};

const STATUS_LABELS = {
  available: 'Available',
  reserved:  'Reserved',
  rented:    'Rented',
  archived:  'Archived',
};

export default function ListingFormModal({ listing, onSave, onClose }) {
  const isEdit = Boolean(listing);
  const [form, setForm] = useState(isEdit ? { ...EMPTY, ...listing } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Keep form in sync if the listing prop changes (e.g. opening different rows)
  useEffect(() => {
    setForm(isEdit ? { ...EMPTY, ...listing } : EMPTY);
    setError('');
  }, [listing?.id]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required.');
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Listing' : 'Add Listing'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <Field label="Title *">
            <input
              className={input}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Modern Studio near BGC"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <Field label="Category">
              <select className={input} value={form.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">— Select —</option>
                {LISTING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>

            {/* Status */}
            <Field label="Status">
              <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {LISTING_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Location */}
          <Field label="Location">
            <input className={input} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="City, district, etc." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Rent */}
            <Field label="Rent (PHP / month)">
              <input className={input} type="number" min="0" value={form.rent} onChange={(e) => set('rent', e.target.value)} placeholder="18000" />
            </Field>

            {/* Beds */}
            <Field label="Bedrooms">
              <input className={input} type="number" min="0" value={form.beds} onChange={(e) => set('beds', e.target.value)} placeholder="1" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Bathrooms */}
            <Field label="Bathrooms">
              <input className={input} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} placeholder="1" />
            </Field>

            {/* Floor area */}
            <Field label="Floor Area (sqm)">
              <input className={input} value={form.floor_area} onChange={(e) => set('floor_area', e.target.value)} placeholder="28" />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea className={`${input} resize-none`} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short description for the listing…" />
          </Field>

          {/* Amenities */}
          <Field label="Amenities (comma-separated)">
            <input className={input} value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="Pool, Gym, 24hr Security" />
          </Field>

          {/* Rules */}
          <Field label="Rules / Terms (comma-separated)">
            <input className={input} value={form.rules} onChange={(e) => set('rules', e.target.value)} placeholder="No pets, 2 months deposit" />
          </Field>

          {/* Contact */}
          <Field label="Contact">
            <input className={input} value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Your name, phone, or Messenger link" />
          </Field>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

const input =
  'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500';
