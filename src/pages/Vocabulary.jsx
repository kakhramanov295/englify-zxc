import React, { useState } from 'react';

function Vocabulary({ language, words, addWord, deleteWord, onBack, isLoading, t }) {
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');

  if (!language && !isLoading) {
    return (
      <div className="empty-state">
        <h3>Language not found</h3>
        <button className="btn" onClick={onBack}>{t.back}</button>
      </div>
    );
  }

  const handleAdd = (e) => {
    e.preventDefault();
    if (original.trim() && translation.trim()) {
      addWord(language.id, original.trim(), translation.trim());
      setOriginal('');
      setTranslation('');
    }
  };

  return (
    <div className="vocabulary">
      <div className="page-header">
        <div className="page-title-group">
          <button className="btn" onClick={onBack}>← {t.back}</button>
          <h2>{language?.name || '...'} {t.vocabularyTitle}</h2>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {!isLoading && `${words.length} ${words.length === 1 ? t.word : t.words}`}
        </div>
      </div>

      <form className="form-row" onSubmit={handleAdd}>
        <div className="form-group">
          <label>{t.wordIn} {language?.name}</label>
          <input 
            type="text" 
            placeholder="e.g., Hola" 
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>{t.translation}</label>
          <input 
            type="text" 
            placeholder="e.g., Hello" 
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!original.trim() || !translation.trim()}
        >
          {t.addWord}
        </button>
      </form>

      {isLoading ? (
        <div className="word-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="word-item">
              <div className="word-details">
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '40px', marginBottom: '8px' }}></div>
                  <div className="skeleton skeleton-title" style={{ width: '100px' }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-text" style={{ width: '60px', marginBottom: '8px' }}></div>
                  <div className="skeleton skeleton-title" style={{ width: '120px' }}></div>
                </div>
              </div>
              <div className="skeleton skeleton-btn" style={{ width: '80px', height: '40px' }}></div>
            </div>
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <h3>{t.noWords}</h3>
          <p>{t.noWordsDesc}</p>
        </div>
      ) : (
        <div className="word-list">
          {words.map(word => (
            <div key={word.id} className="word-item">
              <div className="word-details">
                <div>
                  <div className="word-label">{t.original}</div>
                  <div className="word-value">{word.original}</div>
                </div>
                <div>
                  <div className="word-label">{t.translation}</div>
                  <div className="word-value">{word.translation}</div>
                </div>
              </div>
              <button 
                className="btn btn-danger"
                onClick={() => deleteWord(word.id)}
              >
                {t.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vocabulary;
