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

  const fallbackWords = {
    'A1-A2': [
      { word: "Family", translation_en: "Family", translation_ru: "Семья", translation_uz: "Oila", language: "English" },
      { word: "Haus", translation_en: "House", translation_ru: "Дом", translation_uz: "Uy", language: "German" },
      { word: "Amigo", translation_en: "Friend", translation_ru: "Друг", translation_uz: "Do'st", language: "Spanish" }
    ],
    'B1-B2': [
      { word: "Environment", translation_en: "Environment", translation_ru: "Окружающая среда", translation_uz: "Atrof-muhit", language: "English" },
      { word: "Erfahrung", translation_en: "Experience", translation_ru: "Опыт", translation_uz: "Tajriba", language: "German" }
    ],
    'C1-C2': [
      { word: "Phenomenon", translation_en: "Phenomenon", translation_ru: "Феномен", translation_uz: "Fenomen", language: "English" },
      { word: "Herausforderung", translation_en: "Challenge", translation_ru: "Вызов", translation_uz: "Qiyinchilik", language: "German" }
    ]
  };

  const startSession = async (level) => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('global_words')
        .select('*')
        .eq('language', selectedLang)
        .eq('level', level);

      // Filter fallbacks by language if Supabase is empty
      const localPool = (fallbackWords[level] || []).filter(w => w.language === selectedLang);
      const pool = (data && data.length > 0) ? data : localPool;

      if (pool.length > 0) {
        setSessionWords(pool);
        pickRandomWord(pool);
        setSelectedLevel(level);
      } else {
        alert(`No words available for ${selectedLang} at this level.`);
      }
    } catch (err) {
      const pool = (fallbackWords[level] || []).filter(w => w.language === selectedLang);
      if (pool.length > 0) {
        setSessionWords(pool);
        pickRandomWord(pool);
        setSelectedLevel(level);
      }
    } finally {
      setFetching(false);
    }
  };

  const pickRandomWord = (pool) => {
    if (!pool || pool.length === 0) return;
    const random = pool[Math.floor(Math.random() * pool.length)];
    
    // DECISION LOGIC: Determine the target translation language
    // Avoid translating English to English, Russian to Russian, etc.
    let targetLang = uiLanguage;
    
    // If Source and Target are the same, try to find a fallback target
    if (selectedLang.toLowerCase() === 'english' && uiLanguage === 'en') {
      targetLang = 'ru'; // Fallback to Russian if trying to translate English to English
    } else if (selectedLang.toLowerCase() === 'german' && uiLanguage === 'de') {
      targetLang = 'en';
    }

    const translation = targetLang === 'ru' ? random.translation_ru : 
                        targetLang === 'uz' ? random.translation_uz : 
                        random.translation_en;
    
    setCurrentWord({ ...random, translation });
    setGuess('');
    setResult(null);
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord || result) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    if (isCorrect) {
      setResult({ type: 'success', message: t.correct });
      // Auto-next after 1.5s
      setTimeout(() => {
        pickRandomWord(sessionWords);
      }, 1500);
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
      alert(`Please add ${selectedLang} to your Library first!`);
    }
  };

  if (!selectedLevel) {
    return (
      <div className="explore-page fade-in">
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
            <option value="French">French</option>
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
        <h2 style={{ fontSize: '1.5rem' }}>{selectedLang} ({selectedLevel})</h2>
      </div>

      <div className="card game-card">
        <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>{t.word}:</div>
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
