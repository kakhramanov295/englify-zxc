import React, { useState } from 'react';

function Game({ languages, words, isLoading }) {
  const [gameActive, setGameActive] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null); // 'success', 'error'
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gameWords, setGameWords] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  const startGame = () => {
    let pool = words;
    if (selectedLanguage !== 'all') {
      pool = words.filter(w => w.languageId === selectedLanguage);
    }

    if (pool.length === 0) return;

    setGameWords(pool);
    setScore({ correct: 0, total: 0 });
    pickNextWord(pool);
    setGameActive(true);
    setResult(null);
  };

  const pickNextWord = (pool = gameWords) => {
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentWord(pool[randomIndex]);
    setGuess('');
    setResult(null);
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      setResult({ type: 'success', message: 'Correct!' });
      setTimeout(() => pickNextWord(), 1500);
    } else {
      setResult({ 
        type: 'error', 
        message: `Incorrect. The correct answer was "${currentWord.translation}".` 
      });
      setTimeout(() => pickNextWord(), 2500);
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
          <h3>No words available</h3>
          <p>You need to add some vocabulary in the Dashboard before you can play the game.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {!gameActive ? (
        <div className="card game-card">
          <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>Practice Mode</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
            Test your knowledge by translating the words correctly.
          </p>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label>Select Language to Practice</label>
            <select 
              value={selectedLanguage} 
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages ({words.length} words)</option>
              {languages.map(lang => {
                const count = words.filter(w => w.languageId === lang.id).length;
                if (count > 0) {
                  return (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} ({count} words)
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
            Start Game
          </button>
        </div>
      ) : (
        <div className="card game-card">
          <div className="game-stats">
            <div>Score: <strong style={{ color: 'var(--text-main)' }}>{score.correct} / {score.total}</strong></div>
            <button className="btn" onClick={stopGame}>End Game</button>
          </div>

          <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Translate to English:
          </div>
          <div className="current-word">
            {currentWord?.original}
          </div>

          <form onSubmit={handleGuess}>
            <div className="game-input-group">
              <input 
                type="text" 
                placeholder="Type translation here..." 
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
                Submit
              </button>
            </div>
          </form>

          {result && (
            <div className={`result-message ${result.type === 'success' ? 'result-success' : 'result-error'}`}>
              {result.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;
