import React, { useState, useEffect } from 'react';
import { wordBank } from '../data/wordBank';

function Explore({ languages, addWord, t, isLoading }) {
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [sessionWords, setSessionWords] = useState([]);

  // Set default language if available
  useEffect(() => {
    if (languages.length > 0 && !selectedLang) {
      setSelectedLang(languages[0].name);
    }
  }, [languages]);

  const startSession = (level) => {
    const bank = wordBank['English']?.[level] || []; // Defaulting to English for demo
    if (bank.length > 0) {
      setSelectedLevel(level);
      setSessionWords(bank);
      pickRandomWord(bank);
    }
  };

  const pickRandomWord = (pool) => {
    const random = pool[Math.floor(Math.random() * pool.length)];
    setCurrentWord(random);
    setGuess('');
    setResult(null);
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    if (isCorrect) {
      setResult({ type: 'success', message: t.correct });
    } else {
      setResult({ type: 'error', message: `${t.incorrect} "${currentWord.translation}"` });
    }
  };

  const saveToStudy = () => {
    const lang = languages.find(l => l.name.toLowerCase() === selectedLang.toLowerCase());
    if (lang) {
      addWord(lang.id, currentWord.original, currentWord.translation);
      pickRandomWord(sessionWords);
    } else {
      alert("Please add this language to your Library first!");
    }
  };

  if (!selectedLevel) {
    return (
      <div className="explore-page">
        <section className="hero-section" style={{ padding: '40px 0' }}>
          <h1>{t.exploreTitle}</h1>
          <p>{t.exploreDesc}</p>
        </section>

        <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto 40px' }}>
          <label>{t.selectLanguage}</label>
          <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
            {languages.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            {languages.length === 0 && <option value="">English</option>}
          </select>
        </div>

        <div className="grid">
          <div className="card" onClick={() => startSession('A1-A2')}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>A1 — A2</h3>
            <p>{t.levelA}</p>
          </div>
          <div className="card" onClick={() => startSession('B1-B2')}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>B1 — B2</h3>
            <p>{t.levelB}</p>
          </div>
          <div className="card" onClick={() => startSession('C1-C2')}>
            <h3 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>C1 — C2</h3>
            <p>{t.levelC}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="page-header">
        <button className="btn" onClick={() => setSelectedLevel(null)}>← {t.back}</button>
        <h2 style={{ fontSize: '1.5rem' }}>{selectedLevel} Practice</h2>
      </div>

      <div className="card game-card">
        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>{selectedLang} {t.word}:</div>
        <div className="current-word">{currentWord?.original}</div>

        <form onSubmit={handleCheck}>
          <div className="game-input-group">
            <input 
              type="text" 
              placeholder="..." 
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={!!result}
              autoFocus
            />
            {!result ? (
              <button type="submit" className="btn btn-primary" disabled={!guess.trim()}>{t.checkAnswer}</button>
            ) : (
              <button type="button" className="btn" onClick={() => pickRandomWord(sessionWords)}>{t.nextWord}</button>
            )}
          </div>
        </form>

        {result && (
          <div style={{ marginTop: '20px' }}>
            <div className={`result-message ${result.type === 'success' ? 'result-success' : 'result-error'}`}>
              {result.message}
            </div>
            {result.type === 'error' && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={saveToStudy}>
                ⭐ {t.saveForLater}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
