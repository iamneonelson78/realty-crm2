/**
 * TemplateManagerModal.jsx
 *
 * Lists all agent templates (standard built-ins + custom DB templates).
 * Standard templates show a lock icon and cannot be deleted.
 * Custom templates can be deleted.
 */

import { useState, useEffect } from 'react';
import { X, Lock, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_TEMPLATES } from '../../lib/listingPostTemplates';
import { listTemplates, deleteTemplate } from '../../lib/listingTemplates';

export default function TemplateManagerModal({ onClose }) {
  const { user } = useAuth();
  const [custom, setCustom]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    listTemplates(user.id)
      .then(setCustom)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await deleteTemplate(id);
      setCustom((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // noop
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Templates</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">
          {DEFAULT_TEMPLATES.map((tpl) => (
            <Row
              key={tpl.id}
              name={tpl.name}
              locked
            />
          ))}

          {loading && (
            <div className="px-6 py-4 text-sm text-gray-400">Loading custom templates…</div>
          )}

          {!loading && custom.length === 0 && (
            <div className="px-6 py-4 text-sm text-gray-400">
              No custom templates yet. Create one in the FB Post Generator.
            </div>
          )}

          {custom.map((tpl) => (
            <Row
              key={tpl.id}
              name={tpl.name}
              onDelete={() => handleDelete(tpl.id)}
              deleting={deleting === tpl.id}
            />
          ))}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ name, locked, onDelete, deleting }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2">
        {locked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-sm text-gray-800 dark:text-gray-200">{name}</span>
        {locked && <span className="text-xs text-gray-400 ml-1">(standard)</span>}
      </div>
      {!locked && (
        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors disabled:opacity-40"
          title="Delete template"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
