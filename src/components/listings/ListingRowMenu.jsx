/**
 * ListingRowMenu.jsx — three-dot contextual menu for a listing row.
 *
 * Shows: View, Edit, Generate FB Post, Delete
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Eye, Pencil, Megaphone, Trash2 } from 'lucide-react';

export default function ListingRowMenu({ onView, onEdit, onPost, onDelete }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef();

  useEffect(() => {
    if (!open) return;
    function close() { setOpen(false); }
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function handleOpen(e) {
    e.stopPropagation();
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen((v) => !v);
  }

  function action(fn) {
    setOpen(false);
    fn?.();
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Row actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-44 rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 text-sm"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <MenuItem icon={<Eye />} label="View" onClick={() => action(onView)} />
          <MenuItem icon={<Pencil />} label="Edit" onClick={() => action(onEdit)} />
          <MenuItem icon={<Megaphone />} label="Generate FB Post" onClick={() => action(onPost)} />
          <hr className="my-1 border-gray-100 dark:border-gray-700" />
          <MenuItem icon={<Trash2 />} label="Delete" onClick={() => action(onDelete)} danger />
        </div>,
        document.body
      )}
    </>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
      }`}
    >
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}
