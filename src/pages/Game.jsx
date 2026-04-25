import React, { useState, useEffect, useMemo } from 'react';

function Game({ languages, words, updateWordStats, isLoading, t }) {
  const [gameActive, setGameActive] = useState(false);
  const [queue, setQueue] = useState([]);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [selectedLanguage, setSelectedLanguage] = useState('all');

  // The current word is ALWAYS the first element of the queue
  const currentWord = useMemo(() => queue.length > 0 ? queue[0] : null, [queue]);

  const initLearningSession = () => {
    let pool = words;
    if (selectedLanguage !== 'all') {
      pool = words.filter(w => String(w.languageId) === String(selectedLanguage));
    }

    if (pool.length === 0) {
      alert(t.noWordsAvailable || "Add words first!");
      return;
    }

    // PRIORITY LOGIC: 
    // 1. Words due for review (Hard/Learning)
    // 2. New words
    // 3. Known words
    const sortedPool = [...pool].sort((a, b) => {
      const priority = { hard: 4, learning: 3, new: 2, known: 1 };
      const pA = priority[a.status] || 2;
      const pB = priority[b.status] || 2;
      if (pA !== pB) return pB - pA;
      return new Date(a.last_seen || 0) - new Date(b.last_seen || 0);
    });

    setQueue(sortedPool);
    setStats({ correct: 0, total: 0 });
    setGameActive(true);
    setResult(null);
    setGuess('');
  };

  const handleAnswer = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord || result) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    
    // Update Global State & Supabase
    if (updateWordStats) {
      updateWordStats(currentWord.id, isCorrect);
    }

    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      setResult({ type: 'success', message: t.correct });
      
      // Correct answer: Move to next word (remove from current session queue)
      setTimeout(() => {
        setQueue(prev => prev.slice(1));
        setGuess('');
        setResult(null);
      }, 1500);
    } else {
      setResult({ 
        type: 'error', 
        message: `${t.incorrect} "${currentWord.translation}".` 
      });

      // Incorrect answer: ADAPTIVE REPEAT
      // Don't remove from queue, just move it a few positions back to repeat later
      setTimeout(() => {
        setQueue(prev => {
          const [failedWord, ...rest] = prev;
          const reinsertIdx = Math.min(3, rest.length); // Reinsert after 3 words
          const newQueue = [...rest];
          newQueue.splice(reinsertIdx, 0, failedWord);
          return newQueue;
        });
        setGuess('');
        setResult(null);
      }, 3000);
    }
  };

  const finishSession = () => {
    setGameActive(false);
    setQueue([]);
  };

  if (isLoading) return <div className="game-container"><div className="card game-card">{t.processing}</div></div>;

  return (
    <div className="game-container fade-in">
      {!gameActive ? (
        <div className="card game-card">
          <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>{t.practiceMode}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>{t.practiceDesc}</p>
          
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '30px' }}>
            <label>{t.selectLanguage}</label>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
              <option value="all">{t.allLanguages} ({words.length})</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '15px' }} onClick={initLearningSession}>
            {t.startGame}
          </button>
        </div>
      ) : (
        <div className="card game-card">
          {queue.length === 0 ? (
            <div className="session-complete">
              <h2 style={{ color: 'var(--success)', marginBottom: '20px' }}>{t.congrats}</h2>
              <p>{t.sessionCompleteDesc || "You've reviewed all words in this queue!"}</p>
              <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={finishSession}>{t.back}</button>
            </div>
          ) : (
            <>
              <div className="game-stats">
                <div>{t.score}: <strong>{stats.correct} / {stats.total}</strong></div>
                <div style={{ color: 'var(--text-secondary)' }}>{t.wordsLeft || "Left"}: {queue.length}</div>
                <button className="btn" onClick={finishSession}>{t.endGame}</button>
              </div>

              <div className="game-stats-row">
                <div style={{ color: 'var(--text-secondary)' }}>{t.translateToEnglish}</div>
                {currentWord?.status && (
                  <span className={`status-badge status-${currentWord.status}`}>
                    {currentWord.status}
                  </span>
                )}
              </div>
              
              <div className="current-word">{currentWord?.original}</div>

              <form onSubmit={handleAnswer}>
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
                <div className={`result-message ${result.type === 'success' ? 'result-success' : 'result-error'}`}>
                  {result.message}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Game;
