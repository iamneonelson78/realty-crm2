import { Briefcase, Building, Home } from 'lucide-react';

export default function StepWelcome({ role, setRole, onNext }) {
  const roles = [
    { id: 'agent', icon: <Briefcase className="w-6 h-6" />, label: 'Rental Agent' },
    { id: 'broker', icon: <Building className="w-6 h-6" />, label: 'Broker' },
    { id: 'owner', icon: <Home className="w-6 h-6" />, label: 'Property Owner' },
  ];

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome to Realty CRM 🎉</h2>
        <p className="text-center text-slate-600 mb-8">Before we start, tell us how you work.</p>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Are you a:</label>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.label)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                role === r.label 
                  ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm' 
                  : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`${role === r.label ? 'text-brand-600' : 'text-slate-400'}`}>
                {r.icon}
              </div>
              <span className="font-semibold">{r.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!role}
          className="mt-8 w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
