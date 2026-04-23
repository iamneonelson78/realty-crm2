import { useEffect, useState, useCallback } from 'react';
import { Plus, Download, Upload, Printer, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { listConnections, getPrimaryMessengerHandle } from '../../lib/connections';
import { listListings, createListing, updateListing, deleteListing } from '../../lib/listings';
import { LISTING_CATEGORIES, LISTING_STATUSES } from '../../lib/listingPostTemplates';
import { migrateFromLocalStorage } from '../../lib/listingTemplates';
import { exportListingsXlsx, importListingsXlsx, downloadImportTemplate } from '../../lib/listingImportExport';
import ListingFormModal from '../../components/listings/ListingFormModal';
import ListingViewModal from '../../components/listings/ListingViewModal';
import ListingRowMenu from '../../components/listings/ListingRowMenu';
import FBPostGeneratorModal from '../../components/listings/FBPostGeneratorModal';
import TemplateManagerModal from '../../components/listings/TemplateManagerModal';

const STATUS_COLOR = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  reserved:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  rented:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  archived:  'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

export default function ListingManager() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [messengerHandle, setMessengerHandle] = useState('');

  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterSt, setFilterSt]   = useState('');

  const [formListing, setFormListing]     = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [viewListing, setViewListing]     = useState(null);
  const [postListing, setPostListing]     = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    listConnections(user.id)
      .then((rows) => setMessengerHandle(getPrimaryMessengerHandle(rows)))
      .catch(() => {});
    migrateFromLocalStorage(user.id).catch(() => {});
  }, [user?.id]);

  const loadListings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadError('');
    try {
      const rows = await listListings(user.id);
      setListings(rows);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const filtered = listings.filter((l) => {
    if (filterCat && l.category !== filterCat) return false;
    if (filterSt  && l.status  !== filterSt)  return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.title?.toLowerCase().includes(q) && !l.location?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function handleSave(fields) {
    if (!user?.id) return;
    const isEdit = Boolean(formListing?.id);
    const saved = isEdit
      ? await updateListing(formListing.id, fields)
      : await createListing(user.id, fields);
    setListings((prev) => {
      const exists = prev.some((l) => l.id === saved.id);
      return exists ? prev.map((l) => (l.id === saved.id ? saved : l)) : [saved, ...prev];
    });
    setShowForm(false);
    toast.success(isEdit ? 'Listing updated.' : 'Listing created.');
  }

  async function handlePostSave(updatedListing) {
    if (!updatedListing?.id) return;
    const saved = await updateListing(updatedListing.id, updatedListing);
    setListings((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
    setPostListing(saved);
    toast.success('Listing updated.');
  }

  async function handleDelete(id) {
    const ok = await confirm({
      title: 'Delete listing',
      message: 'Delete this listing? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Listing deleted.');
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user?.id) return;
    try {
      const rows = await importListingsXlsx(file);
      if (!rows.length) { toast.warning('No valid rows found in file.'); return; }
      let created = 0;
      for (const row of rows) {
        try {
          const saved = await createListing(user.id, row);
          setListings((prev) => [saved, ...prev]);
          created++;
        } catch { /* skip bad rows */ }
      }
      toast.success(`Imported ${created} listing${created !== 1 ? 's' : ''}.`);
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Listings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filtered.length} of {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTemplates(true)} className={toolbar} title="Manage post templates">
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <button onClick={() => window.print()} className={toolbar} title="Print listings">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button onClick={() => exportListingsXlsx(filtered)} className={toolbar} title="Export to Excel" disabled={!filtered.length}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <label className={`${toolbar} cursor-pointer`} title="Import from Excel">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={handleImport} />
          </label>
          <button
            onClick={() => { setFormListing({}); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Listing
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
          placeholder="Search title, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {LISTING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={filterSt}
          onChange={(e) => setFilterSt(e.target.value)}
        >
          <option value="">All Statuses</option>
          {LISTING_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={() => downloadImportTemplate()}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline ml-auto self-center"
        >
          Download import template
        </button>
      </div>

      {/* Mobile: card view */}
      <div className="flex flex-col gap-3 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-gray-400 text-sm">Loading...</p>
        ) : loadError ? (
          <p className="py-10 text-center text-red-500 text-sm">{loadError}</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-gray-400 text-sm">
            {listings.length === 0 ? 'No listings yet. Tap "+ Add Listing" to get started.' : 'No listings match your filters.'}
          </p>
        ) : filtered.map((l) => (
          <div
            key={l.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
            onClick={() => setViewListing(l)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{l.title}</p>
              <p className="text-brand-600 dark:text-brand-400 font-medium text-sm mt-0.5">
                {l.rent != null ? `PHP ${Number(l.rent).toLocaleString()}/mo` : <span className="text-gray-400 font-normal">No rent set</span>}
              </p>
              <div className="mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[l.status] || STATUS_COLOR.archived}`}>
                  {l.status || 'unknown'}
                </span>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ListingRowMenu
                onView={() => setViewListing(l)}
                onEdit={() => { setFormListing(l); setShowForm(true); }}
                onPost={() => setPostListing(l)}
                onDelete={() => handleDelete(l.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-x-auto print:shadow-none print:border-none">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold print:hidden">Category</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Rent</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold print:hidden"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-red-500">{loadError}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                {listings.length === 0 ? 'No listings yet. Click "Add Listing" to get started.' : 'No listings match your filters.'}
              </td></tr>
            ) : filtered.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer" onClick={() => setViewListing(l)}>
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.title}</td>
                <td className="px-4 py-3 print:hidden">
                  {l.category ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300 font-medium">
                      {l.category}
                    </span>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{l.location || '-'}</td>
                <td className="px-4 py-3 text-brand-700 dark:text-brand-400 font-semibold">
                  {l.rent != null ? `PHP ${Number(l.rent).toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLOR[l.status] || STATUS_COLOR.archived}`}>
                    {l.status || 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 print:hidden" onClick={(e) => e.stopPropagation()}>
                  <ListingRowMenu
                    onView={() => setViewListing(l)}
                    onEdit={() => { setFormListing(l); setShowForm(true); }}
                    onPost={() => setPostListing(l)}
                    onDelete={() => handleDelete(l.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ListingFormModal
          listing={formListing?.id ? formListing : null}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
        />
      )}
      {viewListing && (
        <ListingViewModal
          listing={viewListing}
          onClose={() => setViewListing(null)}
          onEdit={() => {
            setFormListing(viewListing);
            setViewListing(null);
            setShowForm(true);
          }}
        />
      )}
      {postListing && (
        <FBPostGeneratorModal
          listing={postListing}
          messengerHandle={messengerHandle}
          onClose={() => setPostListing(null)}
          onSave={handlePostSave}
        />
      )}
      {showTemplates && (
        <TemplateManagerModal onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
}

const toolbar =
  'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40';
