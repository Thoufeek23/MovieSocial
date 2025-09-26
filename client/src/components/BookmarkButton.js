import React, { useEffect, useState } from 'react';
import { BookOpen, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'bookmarked_discussions_v1';

function readBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export default function BookmarkButton({ id }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const bm = readBookmarks();
    setBookmarked(!!bm[id]);
  }, [id]);

  const toggle = (e) => {
    e.stopPropagation();
    const bm = readBookmarks();
    let nowBookmarked = false;
    if (bm[id]) {
      delete bm[id];
      setBookmarked(false);
      nowBookmarked = false;
      toast('Bookmark removed');
    } else {
      bm[id] = Date.now();
      setBookmarked(true);
      nowBookmarked = true;
      toast.success('Discussion bookmarked');
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bm)); } catch (err) { }
    // notify other parts of the UI
    try {
      window.dispatchEvent(new CustomEvent('bookmarksUpdated', { detail: { id, bookmarked: nowBookmarked } }));
    } catch (err) {
      // ignore
    }
  };

  return (
    <button onClick={toggle} aria-pressed={bookmarked} title={bookmarked ? 'Remove bookmark' : 'Bookmark'} className="p-2 rounded bg-black/30 hover:bg-black/40">
      {bookmarked ? <Bookmark size={18} color="#f59e0b"/> : <BookOpen size={18} color="#ffffff" />}
    </button>
  );
}
