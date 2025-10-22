import React from 'react';
import ModleGame from '../components/ModleGame';

const ModlePage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modle — Movie Wordle</h1>
      <p className="text-gray-400 mb-4">Guess the movie of the day. You can set hints and the answer in the source (placeholders).</p>
      <ModleGame />
    </div>
  );
};

export default ModlePage;
