/**
 * FBPostGeneratorModal.jsx
 *
 * Two-column layout:
 * - Left: editable listing details (saves to DB via onSave)
 * - Right: editable generated post with template tabs, char count, copy button, save-as-template
 */

import { useState, useEffect } from 'react';
import { X, Copy, Check, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_TEMPLATES, formatPost } from '../../lib/listingPostTemplates';
import { listTemplates, createTemplate } from '../../lib/listingTemplates';

export default function FBPostGeneratorModal({ listing, messengerHandle, onClose, onSave }) {
  const { user } = useAuth();
  const [customTemplates, setCustomTemplates] = useState([]);
  const [activeId, setActiveId] = useState(DEFAULT_TEMPLATES[0].id);
  const [post, setPost]         = useState('');
  const [copied, setCopied]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [newName, setNewName]   = useState('');
  const [showSave, setShowSave] = useState(false);
  const [error, setError]       = useState('');

  // Editable listing state
  const [localListing, setLocalListing]       = useState({ ...listing });
  const [savingDetails, setSavingDetails]     = useState(false);
  const [detailsSaved, setDetailsSaved]       = useState(false);

  // Load custom templates
  useEffect(() => {
    if (!user?.id) return;
    listTemplates(user.id).then(setCustomTemplates).catch(() => {});
  }, [user?.id]);

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  // Regenerate post when active template or localListing changes
  useEffect(() => {
    const tpl = allTemplates.find((t) => t.id === activeId);
    if (tpl) setPost(formatPost(localListing, tpl.body, messengerHandle));
  }, [activeId, localListing, messengerHandle, customTemplates]);

  function updateField(key, value) {
    setLocalListing((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveDetails() {
    if (!onSave) return;
    setSavingDetails(true);
    try {
      await onSave(localListing);
      setDetailsSaved(true);
      setTimeout(() => setDetailsSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSaveTemplate() {
    if (!newName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const saved = await createTemplate(user.id, { name: newName.trim(), body: post });
      setCustomTemplates((prev) => [saved, ...prev]);
      setActiveId(saved.id);
      setShowSave(false);
      setNewName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const photos = Array.isArray(localListing.photo_urls) ? localListing.photo_urls : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">FB Post Generator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 flex-1 min-h-0 overflow-hidden">
          {/* Left: editable listing details */}
          <div className="px-6 py-5 space-y-3 text-sm overflow-y-auto">
            {photos[0] && (
              <img src={photos[0].web_content_link} alt="" className="w-full h-32 object-cover rounded-lg" />
            )}
            <EditField label="Title"      value={localListing.title || ''}      onChange={(v) => updateField('title', v)} />
            <EditField label="Location"   value={localListing.location || ''}   onChange={(v) => updateField('location', v)} />
            <EditField label="Rent"       value={localListing.rent ?? ''}       onChange={(v) => updateField('rent', v)} type="number" />
            <EditField label="Category"   value={localListing.category || ''}   onChange={(v) => updateField('category', v)} />
            <EditField label="Beds"       value={localListing.beds || ''}       onChange={(v) => updateField('beds', v)} />
            <EditField label="Bathrooms"  value={localListing.bathrooms || ''}  onChange={(v) => updateField('bathrooms', v)} />
            <EditField label="Floor Area" value={localListing.floor_area || ''} onChange={(v) => updateField('floor_area', v)} placeholder="sqm" />
            <EditField label="Amenities"  value={localListing.amenities || ''}  onChange={(v) => updateField('amenities', v)} textarea />
            <EditField label="Rules"      value={localListing.rules || ''}      onChange={(v) => updateField('rules', v)} textarea />
            {onSave && (
              <button
                onClick={handleSaveDetails}
                disabled={savingDetails}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60 transition-colors"
              >
                {savingDetails ? 'Saving…' : detailsSaved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
              </button>
            )}
          </div>

          {/* Right: editable post */}
          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
            {/* Template tabs */}
            <div className="flex gap-2 flex-wrap">
              {allTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                    activeId === t.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Editable textarea */}
            <textarea
              className="flex-1 min-h-[380px] w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={post}
              onChange={(e) => setPost(e.target.value)}
            />

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{post.length} characters</span>
              {post.length > 2200 && (
                <span className="text-amber-500">⚠ Facebook recommends under 2200</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>

              <button
                onClick={() => setShowSave((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Bookmark className="w-4 h-4" />
                Save as Template
              </button>
            </div>

            {showSave && (
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Template name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving || !newName.trim()}
                  className="px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60"
                >
                  {saving ? '…' : 'Save'}
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', textarea = false, placeholder }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-gray-400 dark:text-gray-500 w-24 shrink-0 pt-1.5 text-xs">{label}</span>
      {textarea ? (
        <textarea
          className="flex-1 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[56px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className="flex-1 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
