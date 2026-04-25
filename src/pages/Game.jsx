import React, { useState } from 'react';

function Game({ languages, words, updateWordStats, isLoading, t }) {
  const [gameActive, setGameActive] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null); // 'success', 'error'
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameWords, setGameWords] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const [currentIndex, setCurrentIndex] = useState(0);

  const startGame = () => {
    let pool = words;
    if (selectedLanguage !== 'all') {
      pool = words.filter(w => w.languageId === selectedLanguage);
    }

    if (pool.length === 0) return;

    // Shuffle and start
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setGameWords(shuffled);
    setCurrentIndex(0);
    setCurrentWord(shuffled[0]);
    setScore({ correct: 0, total: 0 });
    setGameActive(true);
    setResult(null);
    setGuess('');
  };

  const nextWord = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < gameWords.length) {
      setCurrentIndex(nextIdx);
      setCurrentWord(gameWords[nextIdx]);
      setGuess('');
      setResult(null);
    } else {
      alert(t.congrats || "Game finished!");
      stopGame();
    }
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord || result) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    
    // Sync stats with Supabase
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
    }
  };

  const stopGame = () => {
    setGameActive(false);
    setCurrentWord(null);
  };

  if (isLoading) {
    return (
      <div className="game-container">
        <div className="card game-card">
          <div className="skeleton skeleton-title" style={{ height: '32px', width: '200px', margin: '0 auto 20px' }}></div>
          <div className="skeleton skeleton-text" style={{ height: '24px', width: '300px', margin: '0 auto 30px' }}></div>
          <div className="skeleton skeleton-btn" style={{ width: '100%', height: '50px' }}></div>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="game-container">
        <div className="empty-state">
          <h3>{t.noWordsAvailable}</h3>
          <p>{t.noWordsAvailableDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {!gameActive ? (
        <div className="card game-card">
          <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>{t.practiceMode}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            {t.practiceDesc}
          </p>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label>{t.selectLanguage}</label>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">{t.allLanguages} ({words.length} {words.length === 1 ? t.word : t.words})</option>
              {languages.map(lang => {
                const count = words.filter(w => w.languageId === lang.id).length;
                if (count > 0) {
                  return (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} ({count} {count === 1 ? t.word : t.words})
                    </option>
                  );
                }
                return null;
              })}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '1.2rem', padding: '15px' }}
            onClick={startGame}
            disabled={
              (selectedLanguage === 'all' && words.length === 0) || 
              (selectedLanguage !== 'all' && words.filter(w => w.languageId === selectedLanguage).length === 0)
            }
          >
            {t.startGame}
          </button>
        </div>
      ) : (
        <div className="card game-card">
          <div className="game-stats">
            <div>{t.score}: <strong style={{ color: 'var(--text-main)' }}>{score.correct} / {score.total}</strong></div>
            <button className="btn" onClick={stopGame}>{t.endGame}</button>
          </div>

          <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {t.translateToEnglish}
          </div>
          <div className="current-word">
            {currentWord?.original}
          </div>

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
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!!result || !guess.trim()}
              >
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
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '15px' }} 
                  onClick={nextWord}
                >
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
