import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

function Explore({ languages, addWord, t, uiLanguage, isLoading }) {
  const [selectedLang, setSelectedLang] = useState('English');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [queue, setQueue] = useState([]);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
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

  // Current word is always the first in queue
  const currentWord = useMemo(() => {
    if (queue.length > 0) {
      const raw = queue[0];
      let targetLang = uiLanguage;
      if (selectedLang.toLowerCase() === 'english' && uiLanguage === 'en') targetLang = 'ru';
      else if (selectedLang.toLowerCase() === 'german' && uiLanguage === 'de') targetLang = 'en';

      const translation = targetLang === 'ru' ? raw.translation_ru : 
                          targetLang === 'uz' ? raw.translation_uz : 
                          raw.translation_en;

      return { ...raw, translation };
    }
    return null;
  }, [queue, uiLanguage, selectedLang]);

  useEffect(() => {
    setSelectedLevel(null);
    setQueue([]);
    setResult(null);
  }, [selectedLang]);

  const startSession = async (levelRange) => {
    setFetching(true);
    
    // Normalize level: "A1-A2" -> ["A1", "A2"]
    const levels = levelRange.split('-');
    console.log("LEVEL RANGE SELECTED:", levelRange);
    console.log("NORMALIZED LEVELS:", levels);

    try {
      // Query Supabase for ANY level in the range
      const { data } = await supabase
        .from('global_words')
        .select('*')
        .eq('language', selectedLang)
        .in('level', levels);

      console.log("DB RAW DATA:", data);

      // Filter fallbacks correctly
      const localPool = (fallbackWords[levelRange] || []).filter(w => w.language === selectedLang);
      const pool = (data && data.length > 0) ? data : localPool;

      console.log("FINAL WORD POOL:", pool);

      if (pool && pool.length >= 2) {
        setQueue([...pool].sort(() => Math.random() - 0.5));
        setSelectedLevel(levelRange);
        setResult(null);
        setGuess('');
      } else {
        alert(t.noWordsAvailable || "Not enough words available for this level yet.");
      }
    } catch (err) {
      console.error("COURSE ERROR:", err);
      const localPool = (fallbackWords[levelRange] || []).filter(w => w.language === selectedLang);
      if (localPool.length >= 2) {
        setQueue([...localPool].sort(() => Math.random() - 0.5));
        setSelectedLevel(levelRange);
      } else {
        alert("Error loading words.");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (!guess.trim() || !currentWord || result) return;

    const isCorrect = guess.toLowerCase().trim() === currentWord.translation.toLowerCase().trim();
    if (isCorrect) {
      setResult({ type: 'success', message: t.correct });
      setTimeout(() => {
        setQueue(prev => prev.slice(1));
        setResult(null);
        setGuess('');
      }, 1500);
    } else {
      setResult({ type: 'error', message: `${t.incorrect} "${currentWord.translation}"` });
      // On error in discovery, move it to the end of the current queue to repeat later
      setTimeout(() => {
        setQueue(prev => {
          const [failed, ...rest] = prev;
          const newQ = [...rest, failed];
          return newQ;
        });
        setResult(null);
        setGuess('');
      }, 3000);
    }
  };

  const saveToStudy = () => {
    const lang = languages.find(l => l.name.toLowerCase() === selectedLang.toLowerCase());
    if (lang && currentWord) {
      addWord(lang.id, currentWord.word, currentWord.translation);
      // Remove from current queue after saving
      setQueue(prev => prev.slice(1));
      setResult(null);
      setGuess('');
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
        {queue.length === 0 ? (
          <div className="session-complete">
            <h2 style={{ color: 'var(--success)', marginBottom: '20px' }}>{t.congrats}</h2>
            <p>{t.exploreCompleteDesc || "You've discovered all words for this level!"}</p>
            <button className="btn btn-primary" onClick={() => setSelectedLevel(null)}>{t.back}</button>
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
              {t.wordsLeft || "Remaining"}: {queue.length}
            </div>
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
                {!result && (
                  <button type="submit" className="btn btn-primary" disabled={!guess.trim()}>{t.checkAnswer}</button>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Explore;
