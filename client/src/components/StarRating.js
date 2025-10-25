import React, { useState, useRef } from 'react';

// StarRating - supports selecting ratings in 0.5 increments (0.5, 1.0, 1.5 ... 5.0)
// Visual approach: each star renders a gray ★ with an absolutely positioned yellow ★ overlay clipped to the fill percent.
const StarRating = ({ rating = 0, setRating }) => {
  const [hover, setHover] = useState(0);
  const rootRef = useRef(null);

  const displayValue = hover || rating || 0;

  const handleMove = (e, index) => {
    // determine whether pointer is on left or right half of the star
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    const value = index + half;
    setHover(value);
  };

  const handleLeave = () => setHover(0);

  const handleClick = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    const value = index + half;
    setRating(value);
  };

  const handleKeyDown = (e) => {
    if (!setRating) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setRating(Math.max(0.5, (Number(rating) || 0) - 0.5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setRating(Math.min(5, (Number(rating) || 0) + 0.5));
    }
  };

  return (
    <div ref={rootRef} className="flex items-center space-x-1" onKeyDown={handleKeyDown} tabIndex={0} aria-label={`Rating ${displayValue} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const val = displayValue - index;
        const pct = Math.max(0, Math.min(100, val * 100)); // 0..100
        return (
          <button
            key={index}
            type="button"
            onMouseMove={(e) => handleMove(e, index)}
            onMouseLeave={handleLeave}
            onClick={(e) => handleClick(e, index)}
            className="relative text-3xl leading-none p-0 m-0 bg-transparent border-0 cursor-pointer"
            aria-label={`Set rating to ${index + 0.5} or ${index + 1}`}
            title={`Click left for ${index + 0.5}, right for ${index + 1}`}
          >
            <span className="text-gray-500">&#9733;</span>
            <span
              className="absolute top-0 left-0 overflow-hidden text-yellow-400"
              style={{ width: `${pct}%`, WebkitTextFillColor: 'currentColor' }}
            >
              &#9733;
            </span>
          </button>
        );
      })}
      <div className="ml-2 text-sm font-semibold text-gray-100">{(Number(displayValue) || 0).toFixed(1)}</div>
    </div>
  );
};

export default StarRating;