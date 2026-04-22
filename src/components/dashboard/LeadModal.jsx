import { useState } from 'react';
import { X, Plus, MessageCircle, Phone } from 'lucide-react';

const EMPTY = { name: '', messengerLink: '', mobile: '', interestedUnit: '' };

export default function LeadModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData(EMPTY);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(formData);
      setFormData(EMPTY);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Fast Lead Entry</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Required</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 border focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="e.g. Maria Santos" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Messenger Link *</label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
                <input required type="text" value={formData.messengerLink} onChange={e => setFormData({...formData, messengerLink: e.target.value})} 
                  className="pl-9 w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 border focus:ring-brand-500 focus:border-brand-500 text-sm" placeholder="m.me/maria.santos" />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Optional</h4>
            <div className="grid grid-cols-1 gap-3">
               <div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="text" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})}
                      className="pl-8 w-full border-slate-200 rounded-lg p-2 bg-slate-50 border focus:ring-brand-500 text-sm" placeholder="Mobile number" />
                  </div>
               </div>
               <div>
                  <input type="text" value={formData.interestedUnit} onChange={e => setFormData({...formData, interestedUnit: e.target.value})}
                    className="w-full border-slate-200 rounded-lg p-2 bg-slate-50 border focus:ring-brand-500 text-sm" placeholder="Interested unit" />
               </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-[2] py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium flex justify-center items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {submitting ? 'Saving…' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
