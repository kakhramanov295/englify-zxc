import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function Explore({ languages, addWord, t, uiLanguage, isLoading }) {
  const [selectedLang, setSelectedLang] = useState('English');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [sessionWords, setSessionWords] = useState([]);
  const [fetching, setFetching] = useState(false);

  const startSession = async (level) => {
    setFetching(true);
    // Fetch from Supabase global_words
    const { data, error } = await supabase
      .from('global_words')
      .select('*')
      .eq('language', selectedLang)
      .eq('level', level);

    if (data && data.length > 0) {
      setSelectedLevel(level);
      setSessionWords(data);
      pickRandomWord(data);
    } else {
      alert("No words found in database for this level yet!");
    }
    setFetching(false);
  };

  const pickRandomWord = (pool) => {
    const random = pool[Math.floor(Math.random() * pool.length)];
    // Dynamically pick translation based on UI language
    const translation = uiLanguage === 'ru' ? random.translation_ru : 
                        uiLanguage === 'uz' ? random.translation_uz : 
                        random.translation_en;
    
    setCurrentWord({ ...random, translation });
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
      addWord(lang.id, currentWord.word, currentWord.translation);
      pickRandomWord(sessionWords);
    } else {
      alert("Please add " + selectedLang + " to your Library first!");
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
            <option value="English">English</option>
            <option value="German">German</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>

        <div className="grid">
          {['A1-A2', 'B1-B2', 'C1-C2'].map(lvl => (
            <div key={lvl} className="card level-card" onClick={() => startSession(lvl)}>
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>{lvl}</h3>
              <p>{lvl === 'A1-A2' ? t.levelA : lvl === 'B1-B2' ? t.levelB : t.levelC}</p>
            </div>
          ))}
        </div>
        {fetching && <div style={{ marginTop: '20px' }}>{t.processing}</div>}
      </div>
    );
  }

  return (
    <div className="game-container fade-in">
      <div className="page-header">
        <button className="btn" onClick={() => setSelectedLevel(null)}>← {t.back}</button>
        <h2 style={{ fontSize: '1.5rem' }}>{selectedLevel}</h2>
      </div>

      <div className="card game-card">
        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>{selectedLang} {t.word}:</div>
        <div className="current-word">{currentWord?.word}</div>

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
