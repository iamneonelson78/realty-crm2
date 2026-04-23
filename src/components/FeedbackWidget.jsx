import { useState, useRef } from 'react';
import { MessageSquarePlus, X, Send, Bug, HelpCircle, Lightbulb, MoreHorizontal, Star, CheckCircle2, Paperclip, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const categoryConfig = {
  Bug:        { icon: Bug,            color: 'text-rose-500',   active: 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400' },
  Question:   { icon: HelpCircle,     color: 'text-sky-500',    active: 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-400' },
  Suggestion: { icon: Lightbulb,      color: 'text-amber-500',  active: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' },
  Other:      { icon: MoreHorizontal, color: 'text-slate-500',  active: 'bg-slate-100 border-slate-400 text-slate-700 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-200' },
};

export default function FeedbackWidget() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('Suggestion');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState([]); // [{ file, preview }]
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isAnon, setIsAnon] = useState(false);

  const handleOpen = async () => {
    setIsOpen(true);
    const { data: { user } } = await supabase.auth.getUser();
    setIsAnon(!user);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setEmail('');
      setRating(0);
      setCategory('Suggestion');
      setError(null);
      setAttachments((prev) => {
        prev.forEach((item) => { if (item.preview) URL.revokeObjectURL(item.preview); });
        return [];
      });
      setIsAnon(false);
    }, 300);
  };

  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const slots = MAX_FILES - attachments.length;
    const allowed = incoming.slice(0, slots);
    const rejected = [];

    const valid = allowed.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) { rejected.push(`${f.name}: unsupported type`); return false; }
      if (f.size > MAX_FILE_SIZE) { rejected.push(`${f.name}: exceeds 5 MB`); return false; }
      return true;
    });

    if (rejected.length) toast.warning(rejected.join(', '));
    if (valid.length === 0) return;

    const newItems = valid.map((f) => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }));
    setAttachments((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (isAnon && !email.trim()) {
      setError('Please provide your email so we can follow up.');
      setSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const encodedFiles = await Promise.all(
      attachments.map(async ({ file }) => ({
        name: file.name,
        mime: file.type,
        data: await fileToBase64(file),
      }))
    );

    const payload = {
      category,
      rating: rating || null,
      message,
      email: email.trim() || null,
      page_url: window.location.pathname,
      user_agent: navigator.userAgent,
      userId: user?.id ?? null,
      files: encodedFiles,
    };

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      setSubmitted(true);
      toast.success('Feedback submitted. Thank you!');
      setTimeout(() => handleClose(), 3000);
    } catch (err) {
      setError(err.message || 'Failed to send feedback. Please try again.');
      toast.error(err.message || 'Failed to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Tab trigger — mid-right on desktop, bottom-right on mobile */}
      <div className={`
        fixed z-40 transform transition-transform duration-300
        bottom-20 right-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2
        ${isOpen ? 'translate-x-full' : 'sm:translate-x-[68%] sm:hover:translate-x-0 translate-x-[calc(100%-2.25rem)]'}
      `}>
        <button
          onClick={handleOpen}
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
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-6 flex-shrink-0">
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

            {/* Email (required when anonymous) */}
            {isAnon && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Your Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required={isAnon}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="so we can follow up"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                />
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Message</label>
              <textarea
                required rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                placeholder="Tell us what's on your mind…"
              />
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Attachments <span className="normal-case font-normal">(max {MAX_FILES})</span>
                </label>
                {attachments.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
                  >
                    <Paperclip className="w-3 h-3" /> Attach
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_TYPES.join(',')}
                className="hidden"
                onChange={handleFileChange}
              />
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                      {item.preview ? (
                        <img src={item.preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="flex-1 text-xs text-slate-700 dark:text-slate-300 truncate">{item.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Images or PDF · max 5 MB each</p>
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
