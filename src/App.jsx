// DAUN - Vocabulary App
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Vocabulary from './pages/Vocabulary';
import Game from './pages/Game';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';
import { useLanguages } from './context/LanguageContext';
import './index.css';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { 
    uiLanguage, 
    activeLanguageId, 
    languages, 
    words, 
    t, 
    isLoading: dataLoading,
    changeUiLanguage,
    changeActiveLanguage,
    addLanguage,
    deleteLanguage,
    addWord,
    deleteWord,
    updateWordStats
  } = useLanguages();

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authError, setAuthError] = useState(null);

  // Sync route with activeLanguageId on refresh
  useEffect(() => {
    if (activeLanguageId && !dataLoading) {
      setCurrentPage('vocabulary');
    }
  }, [activeLanguageId, dataLoading]);

  const navigateToVocab = (langId) => {
    changeActiveLanguage(langId);
    setCurrentPage('vocabulary');
  };

  const handleBackToDashboard = () => {
    changeActiveLanguage(null);
    setCurrentPage('dashboard');
  };

  // Prevent flash: show nothing or a loader until initialized
  if (authLoading || dataLoading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading LangStudy...</p>
      </div>
    );
  }

  return (
    <>
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        user={user}
        t={t}
        uiLanguage={uiLanguage}
        changeLanguage={changeUiLanguage}
      />
      
      <div className="app-container">
        <main>
          {authError && (
            <div className="auth-error-box">
              <strong>Auth Error:</strong> {authError}
              <button onClick={() => setAuthError(null)}>✖</button>
            </div>
          )}

          {!user ? (
            <section className="hero-section">
              <h1>{t.heroTitle}</h1>
              <p>{t.heroDesc}</p>
              <button className="btn btn-primary btn-large" onClick={() => document.querySelector('.btn-primary').click()}>
                {t.getStarted}
              </button>
            </section>
          ) : (
            <div className="fade-in">
              <div className="sub-nav">
                <button 
                  className={currentPage === 'dashboard' || currentPage === 'vocabulary' ? 'active' : ''} 
                  onClick={handleBackToDashboard}
                >
                  {t.dashboard}
                </button>
                <button 
                  className={currentPage === 'game' ? 'active' : ''} 
                  onClick={() => setCurrentPage('game')}
                >
                  {t.gameMode}
                </button>
                <button 
                  className={currentPage === 'profile' ? 'active' : ''} 
                  onClick={() => setCurrentPage('profile')}
                >
                  {t.profile}
                </button>
              </div>

              {currentPage === 'dashboard' && (
                <Dashboard 
                  languages={languages} 
                  words={words}
                  addLanguage={addLanguage}
                  deleteLanguage={deleteLanguage}
                  onSelectLanguage={navigateToVocab}
                  isLoading={dataLoading}
                  t={t}
                />
              )}
              
              {currentPage === 'vocabulary' && (
                <Vocabulary 
                  language={languages.find(l => l.id === activeLanguageId)}
                  words={words.filter(w => w.languageId === activeLanguageId)}
                  addWord={addWord}
                  deleteWord={deleteWord}
                  onBack={handleBackToDashboard}
                  isLoading={dataLoading}
                  t={t}
                />
              )}

              {currentPage === 'game' && (
                <Game 
                  languages={languages}
                  words={words}
                  activeLanguageId={activeLanguageId}
                  updateWordStats={updateWordStats}
                  isLoading={dataLoading}
                  t={t}
                />
              )}

              {currentPage === 'profile' && (
                <Profile 
                  t={t}
                  uiLanguage={uiLanguage}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
