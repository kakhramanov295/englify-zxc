import React, { useState } from 'react';

function Dashboard({ languages, words, addLanguage, deleteLanguage, onSelectLanguage, isLoading }) {
  const [newLangName, setNewLangName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newLangName.trim()) {
      addLanguage(newLangName.trim());
      setNewLangName('');
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Your Languages</h2>
      </div>

      <form className="form-row" onSubmit={handleAdd}>
        <div className="form-group">
          <label>Add new language</label>
          <input 
            type="text" 
            placeholder="e.g., Spanish, Japanese..." 
            value={newLangName}
            onChange={(e) => setNewLangName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!newLangName.trim()}>
          Add Language
        </button>
      </form>

      {isLoading ? (
        <div className="grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{ marginBottom: '20px' }}></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="skeleton skeleton-btn" style={{ flex: 1 }}></div>
                <div className="skeleton skeleton-btn" style={{ width: '80px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : languages.length === 0 ? (
        <div className="empty-state">
          <h3>No languages yet</h3>
          <p>Start your learning journey by adding a language above.</p>
        </div>
      ) : (
        <div className="grid">
          {languages.map(lang => {
            const wordCount = words.filter(w => w.languageId === lang.id).length;
            return (
              <div key={lang.id} className="card">
                <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>{lang.name}</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} saved
                </p>
                <div className="button-group">
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={() => onSelectLanguage(lang.id)}
                  >
                    View Vocab
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => deleteLanguage(lang.id)}
                    title="Delete language"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
