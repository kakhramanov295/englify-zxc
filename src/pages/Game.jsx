import React, { useState, useMemo, useEffect } from 'react';

function Game({ languages, words, updateWordStats, isLoading, t }) {
  const [gameActive, setGameActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameWords, setGameWords] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  // Derived current word - ALWAYS syncs with currentIndex
  const currentWord = useMemo(() => {
    if (gameWords.length > 0 && currentIndex < gameWords.length) {
      return gameWords[currentIndex];
    }
    return null;
  }, [gameWords, currentIndex]);

  const startGame = () => {
    let pool = words;
    
    if (selectedLanguage !== 'all') {
      pool = words.filter(w => String(w.languageId) === String(selectedLanguage));
    }

    if (pool.length < 2) {
      alert(t.notEnoughWords || "Add at least 2 words to start the game!");
      return;
    }

    // SMART SORTING: Hard -> Learning -> New -> Known
    const priority = { hard: 4, learning: 3, new: 2, known: 1 };
    const sorted = [...pool].sort((a, b) => {
      const pA = priority[a.status || 'new'] || 2;
      const pB = priority[b.status || 'new'] || 2;
      if (pA !== pB) return pB - pA;
      return Math.random() - 0.5; // Shuffle within same priority
    });

    setGameWords(sorted);
    setCurrentIndex(0);
    setScore({ correct: 0, total: 0 });
    setGuess('');
    setResult(null);
    setGameActive(true);
  };

  const nextWord = () => {
    if (currentIndex + 1 < gameWords.length) {
      setCurrentIndex(prev => prev + 1);
      setGuess('');
      setResult(null);
    } else {
      alert(t.congrats || "Session finished! Great job!");
      stopGame();
    }
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord || result) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    
    if (updateWordStats) {
      updateWordStats(currentWord.id, isCorrect);
    }

    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      setResult({ type: 'success', message: t.correct });
      setTimeout(nextWord, 1500);
    } else {
      setResult({ 
        type: 'error', 
        message: `${t.incorrect} "${currentWord.translation}".` 
      });
      
      // ADAPTIVE REPETITION: Insert this word again 3 positions later
      const newQueue = [...gameWords];
      const repeatIdx = Math.min(currentIndex + 4, newQueue.length);
      newQueue.splice(repeatIdx, 0, currentWord); 
      setGameWords(newQueue);
    }
  };

  const stopGame = () => {
    setGameActive(false);
    setGameWords([]);
    setCurrentIndex(0);
    setResult(null);
  };

  if (isLoading) return <div className="game-container"><div className="card game-card">{t.processing}...</div></div>;

  return (
    <div className="game-container fade-in">
      {!gameActive ? (
        <div className="card game-card">
          <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>{t.practiceMode}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{t.practiceDesc}</p>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label>{t.selectLanguage}</label>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">{t.allLanguages} ({words.length})</option>
              {languages.map(lang => {
                const count = words.filter(w => String(w.languageId) === String(lang.id)).length;
                return (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '15px' }} onClick={startGame}>
            {t.startGame}
          </button>
        </div>
      ) : (
        <div className="card game-card">
          <div className="game-stats">
            <div>{t.score}: <strong>{score.correct} / {score.total}</strong></div>
            <button className="btn" onClick={stopGame}>{t.endGame}</button>
          </div>

          <div className="game-stats-row">
            <div style={{ color: 'var(--text-secondary)' }}>
              {t.word} {currentIndex + 1} / {gameWords.length}:
            </div>
            {currentWord?.status && (
              <span className={`status-badge status-${currentWord.status}`}>
                {currentWord.status.toUpperCase()}
              </span>
            )}
          </div>
          <div className="current-word">{currentWord?.original}</div>

          <form onSubmit={handleGuess}>
            <div className="game-input-group">
              <input 
                type="text" 
                placeholder="..." 
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={!!result}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={!!result || !guess.trim()}>
                {t.checkAnswer}
              </button>
            </div>
          </form>

          {result && (
            <div style={{ marginTop: '20px' }}>
              <div className={`result-message ${result.type === 'success' ? 'result-success' : 'result-error'}`}>
                {result.message}
              </div>
              {result.type === 'error' && (
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={nextWord}>
                  {t.nextWord}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;
