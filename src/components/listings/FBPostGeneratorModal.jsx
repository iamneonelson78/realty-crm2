/**
 * FBPostGeneratorModal.jsx
 *
 * Two-column layout:
 * - Left: read-only listing summary
 * - Right: editable generated post with template tabs, char count, copy button, save-as-template
 */

import { useState, useEffect } from 'react';
import { X, Copy, Check, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_TEMPLATES, formatPost } from '../../lib/listingPostTemplates';
import { listTemplates, createTemplate } from '../../lib/listingTemplates';

export default function FBPostGeneratorModal({ listing, messengerHandle, onClose }) {
  const { user } = useAuth();
  const [customTemplates, setCustomTemplates] = useState([]);
  const [activeId, setActiveId] = useState(DEFAULT_TEMPLATES[0].id);
  const [post, setPost]         = useState('');
  const [copied, setCopied]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [newName, setNewName]   = useState('');
  const [showSave, setShowSave] = useState(false);
  const [error, setError]       = useState('');

  // Load custom templates
  useEffect(() => {
    if (!user?.id) return;
    listTemplates(user.id).then(setCustomTemplates).catch(() => {});
  }, [user?.id]);

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  // Regenerate post when active template or listing changes
  useEffect(() => {
    const tpl = allTemplates.find((t) => t.id === activeId);
    if (tpl) setPost(formatPost(listing, tpl.body, messengerHandle));
  }, [activeId, listing, messengerHandle, customTemplates]);

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

  const photos = Array.isArray(listing.photo_urls) ? listing.photo_urls : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">FB Post Generator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          {/* Left: listing summary */}
          <div className="px-6 py-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-gray-900 dark:text-white text-base">{listing.title}</p>
            {photos[0] && (
              <img src={photos[0].web_content_link} alt="" className="w-full h-36 object-cover rounded-lg" />
            )}
            <Row label="Location" value={listing.location} />
            <Row label="Rent" value={listing.rent ? `PHP ${Number(listing.rent).toLocaleString()}/mo` : undefined} />
            <Row label="Category" value={listing.category} />
            <Row label="Beds" value={listing.beds} />
            <Row label="Bathrooms" value={listing.bathrooms} />
            <Row label="Floor Area" value={listing.floor_area ? `${listing.floor_area} sqm` : undefined} />
            <Row label="Amenities" value={listing.amenities} />
            <Row label="Rules" value={listing.rules} />
          </div>

          {/* Right: editable post */}
          <div className="px-6 py-5 flex flex-col gap-4">
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
              className="flex-1 min-h-[260px] w-full p-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
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

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
