import React, { useState, useEffect } from 'react';

const LEVEL_WORDS = {
  A: [
    "Hello", "House", "Water", "Food", "School", "Friend", "Book", "City", "Family", "Morning",
    "Time", "Work", "Happy", "Small", "Large", "Quick", "Slow", "Good", "Bad", "New"
  ],
  B: [
    "Challenge", "Experience", "Environment", "Opportunity", "Success", "Knowledge", "Communication", "Management", "Structure", "Behavior",
    "Creative", "Reliable", "Efficient", "Flexible", "Independent", "Supportive", "Valuable", "Complex", "Standard", "Various"
  ],
  C: [
    "Ambiguous", "Coherent", "Dichotomy", "Eloquent", "Indigenous", "Meticulous", "Pragmatic", "Resilient", "Ubiquitous", "Venerable",
    "Sophisticated", "Versatile", "Paradigm", "Cognitive", "Aesthetic", "Benevolent", "Empirical", "Nuance", "Paradox", "Subtle"
  ]
};

function Templates({ languages, addWord, t, isLoading }) {
  const [level, setLevel] = useState('A');
  const [targetLangId, setTargetLangId] = useState('');
  const [randomWords, setRandomWords] = useState([]);
  const [addedStatus, setAddedStatus] = useState({});

  useEffect(() => {
    generateWords();
  }, [level]);

  const generateWords = () => {
    const pool = LEVEL_WORDS[level];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setRandomWords(shuffled.slice(0, 10));
    setAddedStatus({});
  };

  const handleAdd = (word) => {
    if (!targetLangId) {
      alert("Please select a language you are learning first!");
      return;
    }
    
    // We don't know the translation, so we add it with empty translation or ask user?
    // The user said "person should write the language they want to learn",
    // but they also need to provide the translation if they want to save it.
    // For now, let's open a small prompt for translation.
    const translation = prompt(`${t.translation} for "${word}":`);
    if (translation && translation.trim()) {
      addWord(targetLangId, word, translation.trim());
      setAddedStatus(prev => ({ ...prev, [word]: true }));
    }
  };

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <h2>{t.libraryTitle}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>{t.libraryDesc}</p>
        </div>
        <button className="btn" onClick={generateWords} disabled={isLoading}>
          🔄 Refresh
        </button>
      </div>

      <div className="card glass-card" style={{ marginBottom: '30px', padding: '30px' }}>
        <div className="form-row" style={{ background: 'none', padding: 0, marginBottom: 0 }}>
          <div className="form-group">
            <label>{t.targetLangLabel}</label>
            <select 
              value={targetLangId} 
              onChange={(e) => setTargetLangId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- {t.selectLanguage} --</option>
              {languages.map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t.selectLevel}</label>
            <div className="lang-switcher" style={{ width: '100%', height: '48px', padding: '4px' }}>
              <button 
                className={`lang-btn ${level === 'A' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setLevel('A')}
              >
                A1-A2
              </button>
              <button 
                className={`lang-btn ${level === 'B' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setLevel('B')}
              >
                B1-B2
              </button>
              <button 
                className={`lang-btn ${level === 'C' ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setLevel('C')}
              >
                C1-C2
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid">
        {randomWords.map((word, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="word-label">English</div>
              <div className="word-value" style={{ fontSize: '1.5rem', margin: '10px 0' }}>{word}</div>
            </div>
            <button 
              className={`btn ${addedStatus[word] ? '' : 'btn-primary'}`}
              onClick={() => handleAdd(word)}
              disabled={addedStatus[word]}
              style={{ width: '100%', marginTop: '15px' }}
            >
              {addedStatus[word] ? t.wordAdded : t.addToStudy}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Templates;
