import React, { useEffect, useRef, useState } from 'react';

const LanguageSelect = ({ value, onChange, options = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-gray-100"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{value}</span>
        <svg className="w-4 h-4 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.1 1.02l-4.25 4.654a.75.75 0 01-1.1 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-800 rounded shadow-lg max-h-60 overflow-auto"
        >
          {options.map((opt) => (
            <li
              role="option"
              aria-selected={opt === value}
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-800 ${opt === value ? 'bg-gray-800 text-white font-semibold' : 'text-gray-100'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelect;
