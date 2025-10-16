import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ message = 'Nothing here yet.', ctaText = 'Explore', ctaLink = '/' }) => {
  return (
    <div className="p-6 bg-card rounded text-center">
      <div className="text-3xl mb-3">🎬</div>
      <div className="text-gray-300 mb-4">{message}</div>
      <Link to={ctaLink} className="bg-green-600 px-4 py-2 rounded">{ctaText}</Link>
    </div>
  );
};

export default EmptyState;
