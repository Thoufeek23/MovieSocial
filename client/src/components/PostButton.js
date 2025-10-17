import React, { useState, useRef, useEffect } from 'react';

const PostButton = ({ onChoose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(s => !s)} className="btn btn-ghost px-3 py-2">
        Post
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-card rounded-md shadow-lg py-2 z-50">
          <button onClick={() => { setOpen(false); onChoose('review'); }} className="w-full text-left px-3 py-2 hover:bg-gray-800">Review</button>
          <button onClick={() => { setOpen(false); onChoose('discussion'); }} className="w-full text-left px-3 py-2 hover:bg-gray-800">Discussion</button>
        </div>
      )}
    </div>
  );
};

export default PostButton;
