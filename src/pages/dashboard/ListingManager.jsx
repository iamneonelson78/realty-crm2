import { useEffect, useMemo, useState } from 'react';
import { Copy, Share, MapPin, CheckCircle2, Save, RotateCcw, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import Button from '../../components/ui/Button';
import { listConnections, getPrimaryMessengerHandle } from '../../lib/connections';
import { listListings, createListing, updateListing, deleteListing } from '../../lib/listings';

const EMPTY_FORM = { id: null, title: '', rent: '', location: '', beds: '', rules: '' };

const DEFAULT_TEMPLATES = [
  {
    id: 'template-modern',
    name: 'Modern Highlight',
    body: `FOR RENT: {{title}}
Location: {{location}}

Monthly Rent: PHP {{rent}}
Bedrooms: {{beds}} BR

Inclusions and Terms:
{{rules_list}}

{{messenger_cta}}`,
  },
  {
    id: 'template-friendly',
    name: 'Friendly Agent',
    body: `Hello renters! Sharing a great listing:
{{title}} at {{location}}

Rate: PHP {{rent}} per month
Setup: {{beds}} BR

Quick notes:
{{rules_list}}

Interested? {{messenger_cta}}`,
  },
  {
    id: 'template-formal',
    name: 'Formal Brief',
    body: `PROPERTY OFFERING
Unit: {{title}}
Address: {{location}}
Rate: PHP {{rent}} / month
Bedroom Count: {{beds}} BR

Conditions:
{{rules_list}}

Inquiries:
{{messenger_cta}}`,
  },
];

const toFormShape = (row) => ({
  id: row.id,
  title: row.title ?? '',
  rent: row.rent == null ? '' : String(row.rent),
  location: row.location ?? '',
  beds: row.beds ?? '',
  rules: row.rules ?? '',
});

export default function ListingManager() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showGen, setShowGen] = useState(false);
  const [baseline, setBaseline] = useState(EMPTY_FORM);
  const [genForm, setGenForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [messengerHandle, setMessengerHandle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateBody, setCustomTemplateBody] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    listConnections(user.id).then((rows) => {
      if (cancelled) return;
      setMessengerHandle(getPrimaryMessengerHandle(rows));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const raw = window.localStorage.getItem(`realty:post-templates:${user.id}`);
    if (!raw) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomTemplates([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setCustomTemplates(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomTemplates([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    window.localStorage.setItem(`realty:post-templates:${user.id}`, JSON.stringify(customTemplates));
  }, [customTemplates, user?.id]);

  const allTemplates = useMemo(() => {
    return [...DEFAULT_TEMPLATES, ...customTemplates];
  }, [customTemplates]);

  const selectedTemplate = useMemo(() => {
    return allTemplates.find((t) => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];
  }, [allTemplates, selectedTemplateId]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError('');
    listListings(user.id)
      .then((rows) => { if (!cancelled) setListings(rows); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const isDirty = useMemo(() => {
    return JSON.stringify(baseline) !== JSON.stringify(genForm);
  }, [baseline, genForm]);

  const openEditor = (listing = null) => {
    const seed = listing ? toFormShape(listing) : EMPTY_FORM;
    setBaseline(seed);
    setGenForm(seed);
    setShowGen(true);
  };

  const closeEditor = async () => {
    if (isDirty) {
      const shouldClose = await confirm({
        title: 'Discard unsaved changes',
        message: 'You have unsaved changes. Close without saving?',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        variant: 'warning',
      });
      if (!shouldClose) {
        toast.warning('Close cancelled. You still have unsaved changes.');
        return;
      }
    }
    setShowGen(false);
    setBaseline(EMPTY_FORM);
    setGenForm(EMPTY_FORM);
  };

  const cancelEdits = () => {
    setGenForm(baseline);
  };

  const saveCustomTemplate = () => {
    const name = customTemplateName.trim();
    const body = customTemplateBody.trim();
    if (!name) {
      toast.warning('Template name is required.');
      return;
    }
    if (!body) {
      toast.warning('Template body is required.');
      return;
    }
    const next = {
      id: `custom-${Date.now()}`,
      name,
      body,
    };
    setCustomTemplates((prev) => [next, ...prev]);
    setSelectedTemplateId(next.id);
    setCustomTemplateName('');
    setCustomTemplateBody('');
    toast.success('Custom template saved.');
  };

  const deleteSelectedTemplate = async () => {
    if (!selectedTemplate?.id?.startsWith('custom-')) {
      toast.warning('Only custom templates can be deleted.');
      return;
    }
    const ok = await confirm({
      title: 'Delete template',
      message: `Delete custom template "${selectedTemplate.name}"?`,
      confirmText: 'Delete Template',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) {
      toast.warning('Delete action cancelled.');
      return;
    }
    setCustomTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
    setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
    toast.success('Custom template deleted.');
  };

  const saveListing = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const isUpdate = !!genForm.id;
      const saved = genForm.id
        ? await updateListing(genForm.id, genForm)
        : await createListing(user.id, genForm);
      const persisted = toFormShape(saved);
      setListings((prev) => {
        const exists = prev.some((l) => l.id === saved.id);
        return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
      });
      setBaseline(persisted);
      setGenForm(persisted);
      const now = Date.now();
      setSavedAt(now);
      setTimeout(() => setSavedAt((prev) => (prev === now ? null : prev)), 1800);
      toast.success(isUpdate ? 'Listing updated.' : 'Listing saved.');
    } catch (err) {
      toast.error(`Failed to save listing: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeListing = async (id) => {
    const shouldDelete = await confirm({
      title: 'Delete listing',
      message: 'Delete this listing? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!shouldDelete) {
      toast.warning('Delete action cancelled.');
      return;
    }
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Listing deleted.');
    } catch (err) {
      toast.error(`Failed to delete listing: ${err.message}`);
    }
  };

  const formatPost = (data) => {
    const msg = messengerHandle
      ? `Drop a message here -> ${messengerHandle}`
      : 'Drop a message here -> [Connect your Messenger in Connections]';
    const rulesList = data.rules
      ? data.rules.split(',').map((r) => `- ${r.trim()}`).join('\n')
      : '- standard terms';
    const replacements = {
      title: data.title || '[Title]',
      location: data.location || '[Location]',
      rent: data.rent || '[0]',
      beds: data.beds || '[0]',
      rules_list: rulesList,
      messenger_cta: msg,
    };
    return selectedTemplate.body.replace(/{{\s*([a-z_]+)\s*}}/gi, (_m, key) => replacements[key] || '');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatPost(genForm));
    setCopied(true);
    toast.info('Post copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Listing Manager</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Manage your properties and generate Facebook posts.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => openEditor()}
          icon={<Share className="w-4 h-4" />}
        >
          FB Post Generator
        </Button>
      </div>

      {!showGen ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto transition-colors">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Property Title</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Monthly Rent</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">Loading…</td></tr>
              ) : loadError ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-rose-500">{loadError}</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No listings yet. Generate one to save it!</td></tr>
              ) : listings.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{l.title}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{l.location || '—'}</span></td>
                  <td className="px-6 py-4 text-brand-700 dark:text-brand-400 font-semibold text-base">{l.rent == null ? '—' : `₱ ${Number(l.rent).toLocaleString()}`}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditor(l)}>
                        Generate Post
                      </Button>
                      <button
                        type="button"
                        onClick={() => removeListing(l.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in duration-300 transition-colors overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Post Template</h3>
                <div className="flex flex-wrap gap-2">
                  {allTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedTemplateId === template.id ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'}`}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Placeholders: {'{{title}}'}, {'{{location}}'}, {'{{rent}}'}, {'{{beds}}'}, {'{{rules_list}}'}, {'{{messenger_cta}}'}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <input
                    type="text"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    placeholder="Custom template name"
                    className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm border"
                  />
                  <textarea
                    rows={4}
                    value={customTemplateBody}
                    onChange={(e) => setCustomTemplateBody(e.target.value)}
                    placeholder="Write your custom template with placeholders..."
                    className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm border"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={saveCustomTemplate}>
                      Save Custom Template
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={deleteSelectedTemplate}
                      disabled={!selectedTemplate?.id?.startsWith('custom-')}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-lg text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Property Details</h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                  <input type="text" value={genForm.title} onChange={e => setGenForm({ ...genForm, title: e.target.value })} className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-brand-500 text-sm border" placeholder="e.g. BGC 2BR Fully Furnished" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rent Price (PHP)</label>
                    <input type="number" value={genForm.rent} onChange={e => setGenForm({ ...genForm, rent: e.target.value })} className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-brand-500 text-sm border" placeholder="45000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
                    <input type="number" value={genForm.beds} onChange={e => setGenForm({ ...genForm, beds: e.target.value })} className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-brand-500 text-sm border" placeholder="2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                  <input type="text" value={genForm.location} onChange={e => setGenForm({ ...genForm, location: e.target.value })} className="w-full border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-brand-500 text-sm border" placeholder="Avida Towers, BGC" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Rules / Extras (comma separated)</label>
                  <textarea value={genForm.rules} onChange={e => setGenForm({ ...genForm, rules: e.target.value })} className="w-full flex-1 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-brand-500 text-sm border" rows={2} placeholder="No pets, 1 month advance, With Balcony" />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[500px] transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2"><Share className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Preview</h3>
                <Button
                  variant={copied ? 'success' : 'secondary'}
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg shadow-inner overflow-y-auto font-sans whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {formatPost(genForm)}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDirty
                ? 'Unsaved changes. Save to keep them, Cancel to revert, Close to exit.'
                : savedAt
                  ? 'All changes saved.'
                  : 'No changes yet.'}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="md"
                onClick={closeEditor}
                icon={<X className="w-4 h-4" />}
              >
                Close
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={cancelEdits}
                disabled={!isDirty}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                variant={savedAt ? 'success' : 'primary'}
                size="md"
                onClick={saveListing}
                disabled={saving || (!isDirty && !!savedAt)}
                icon={savedAt ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              >
                {saving ? 'Saving…' : savedAt ? 'Saved!' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
