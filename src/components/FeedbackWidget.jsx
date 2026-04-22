import { useState } from 'react';
import { MessageSquarePlus, X, Send, Bug, HelpCircle, Lightbulb, MoreHorizontal, Star, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

const categoryConfig = {
  Bug:        { icon: Bug,            color: 'text-rose-500',   active: 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400' },
  Question:   { icon: HelpCircle,     color: 'text-sky-500',    active: 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-400' },
  Suggestion: { icon: Lightbulb,      color: 'text-amber-500',  active: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' },
  Other:      { icon: MoreHorizontal, color: 'text-slate-500',  active: 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-200' },
};

export default function FeedbackWidget() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('Suggestion');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setRating(0);
      setCategory('Suggestion');
      setError(null);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      category,
      rating: rating || null,
      message,
    });
    setSubmitting(false);
    if (insertError) {
      setError('Failed to send feedback. Please try again.');
      toast.error('Failed to send feedback. Please try again.');
      return;
    }
    setSubmitted(true);
    toast.success('Feedback submitted. Thank you.');
    setTimeout(() => handleClose(), 3000);
  };

  return (
    <>
      {/* Tab trigger */}
      <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-full' : 'translate-x-[68%] hover:translate-x-0'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white pl-3 pr-4 py-2.5 rounded-l-xl shadow-lg transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold text-sm whitespace-nowrap">Feedback</span>
        </button>
      </div>

      {/* Blade drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 flex transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          style={{ right: '22rem' }}
          onClick={handleClose}
        />

        {/* Panel */}
        <div className={`relative ml-auto w-88 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ width: '22rem' }}>

          {/* Header */}
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold text-lg">Send Feedback</h3>
                </div>
                <p className="text-brand-100 text-sm">Help us improve Realty CRM</p>
              </div>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Star rating */}
            <div className="mt-4">
              <p className="text-brand-100 text-xs font-medium mb-2">Overall experience</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-6 h-6 transition-colors ${n <= (hovered || rating) ? 'text-amber-300 fill-amber-300' : 'text-white/40'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Thank you state */}
          {submitted && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
              <CheckCircle2 className="w-16 h-16 text-brand-500 mb-4" />
              <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Thank you!</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Your feedback has been received. This window will close shortly.</p>
            </div>
          )}

          {/* Form body */}
          <form className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${submitted ? 'hidden' : ''}`} onSubmit={handleSubmit}>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(categoryConfig).map(([c, cfg]) => {
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={c} type="button" onClick={() => setCategory(c)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                        category === c
                          ? cfg.active
                          : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${category === c ? '' : cfg.color}`} />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Message</label>
              <textarea
                required rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                placeholder="Tell us what's on your mind…"
              />
            </div>

            {error && (
              <p className="text-rose-500 text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-xl font-semibold flex justify-center items-center gap-2 transition-colors shadow-md shadow-brand-500/20"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Sending…' : 'Send Feedback'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
