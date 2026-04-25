import React, { useState } from 'react';

function Vocabulary({ language, words, addWord, deleteWord, onBack, isLoading }) {
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');

  if (!language && !isLoading) {
    return (
      <div className="empty-state">
        <h3>Language not found</h3>
        <button className="btn" onClick={onBack}>Go Back</button>
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
          <button className="btn" onClick={onBack}>← Back</button>
          <h2>{language?.name || 'Loading...'} Vocabulary</h2>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {!isLoading && `${words.length} ${words.length === 1 ? 'word' : 'words'}`}
        </div>
      </div>

      <form className="form-row" onSubmit={handleAdd}>
        <div className="form-group">
          <label>Word in {language.name}</label>
          <input 
            type="text" 
            placeholder="e.g., Hola" 
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Translation</label>
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
          Add Word
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
          <h3>No words added</h3>
          <p>Add some vocabulary to start practicing!</p>
        </div>
      ) : (
        <div className="word-list">
          {words.map(word => (
            <div key={word.id} className="word-item">
              <div className="word-details">
                <div>
                  <div className="word-label">Original</div>
                  <div className="word-value">{word.original}</div>
                </div>
                <div>
                  <div className="word-label">Translation</div>
                  <div className="word-value">{word.translation}</div>
                </div>
              </div>
              <button 
                className="btn btn-danger"
                onClick={() => deleteWord(word.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vocabulary;
