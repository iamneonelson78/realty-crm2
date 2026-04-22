export default function StepListing({ listing, setListing, onPrev, onNext }) {
  const isComplete = listing.title && listing.price && listing.location;

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Add your first listing</h2>
        <p className="text-slate-600 mb-8">Let's set up a property you're actively promoting.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (e.g. BGC 2BR Fully Furnished)</label>
            <input
              type="text"
              value={listing.title}
              onChange={(e) => setListing({ ...listing, title: e.target.value })}
              className="block w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 border p-2.5"
              placeholder="Enter listing title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Rent (PHP)</label>
            <input
              type="number"
              value={listing.price}
              onChange={(e) => setListing({ ...listing, price: e.target.value })}
              className="block w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 border p-2.5"
              placeholder="e.g. 45000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location / Building</label>
            <input
              type="text"
              value={listing.location}
              onChange={(e) => setListing({ ...listing, location: e.target.value })}
              className="block w-full border-slate-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 bg-slate-50 border p-2.5"
              placeholder="e.g. Avida Towers, BGC"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onPrev}
            className="flex-1 py-3.5 px-4 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!isComplete}
            className="flex-[2] py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Listing
          </button>
        </div>
      </div>
    </div>
  );
}
