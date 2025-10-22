import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ModleGame from '../components/ModleGame';
import puzzlesEng from '../data/modlePuzzles';
import puzzlesHindi from '../data/modlePuzzlesHindi';
import puzzlesTamil from '../data/modlePuzzlesTamil';
import puzzlesTelugu from '../data/modlePuzzlesTelugu';
import puzzlesKannada from '../data/modlePuzzlesKannada';
import puzzlesMalayalam from '../data/modlePuzzlesMalayalam';

const languageMap = {
  English: puzzlesEng,
  Hindi: puzzlesHindi,
  Tamil: puzzlesTamil,
  Telugu: puzzlesTelugu,
  Kannada: puzzlesKannada,
  Malayalam: puzzlesMalayalam,
};

const ModlePlayPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = searchParams.get('lang') || 'English';

  // if invalid language, go back to selection
  if (!languageMap[lang]) {
    // redirect back to language selection
    navigate('/modle');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modle — {lang}</h1>
      <p className="text-gray-400 mb-4">Playing Modle in <strong>{lang}</strong>. You can only choose one language per day.</p>
      <ModleGame puzzles={languageMap[lang]} language={lang} />
    </div>
  );
};

export default ModlePlayPage;
