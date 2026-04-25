import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Vocabulary from './pages/Vocabulary';
import Game from './pages/Game';
import Explore from './pages/Explore';
import { supabase } from './supabaseClient';
import { translations } from './translations';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [activeLanguageId, setActiveLanguageId] = useState(null);
  const [uiLanguage, setUiLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [words, setWords] = useState([]);
  
  const t = translations[uiLanguage];

  // Auth & Settings Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchUserSettings(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchUserSettings(session.user.id);
      else {
        setLoading(false);
        setLanguages([]);
        setWords([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserSettings = async (userId) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setUiLanguage(data.ui_language);
    } else if (error && error.code === 'PGRST116') {
      // If settings don't exist, create default
      await supabase.from('user_settings').insert([{ user_id: userId, ui_language: 'en' }]);
    }
  };

  const changeLanguage = async (lang) => {
    setUiLanguage(lang);
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, ui_language: lang });
    }
  };

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [langsRes, wordsRes] = await Promise.all([
        supabase.from('languages').select('*').order('created_at'),
        supabase.from('words').select('*').order('created_at')
      ]);

      if (langsRes.data) setLanguages(langsRes.data);
      if (wordsRes.data) {
        setWords(wordsRes.data.map(w => ({ ...w, languageId: w.language_id })));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addLanguage = async (name) => {
    const { data, error } = await supabase.from('languages').insert([{ user_id: user.id, name }]).select();
    if (data) setLanguages([...languages, data[0]]);
  };

  const deleteLanguage = async (id) => {
    const { error } = await supabase.from('languages').delete().eq('id', id);
    if (!error) {
      setLanguages(languages.filter(l => l.id !== id));
      setWords(words.filter(w => w.languageId !== id));
    }
  };

  const addWord = async (languageId, original, translation) => {
    const { data, error } = await supabase.from('words').insert([{ 
      user_id: user.id, 
      language_id: languageId, 
      original, 
      translation,
      status: 'new'
    }]).select();
    if (data) {
      const added = data[0];
      setWords([...words, { ...added, languageId: added.language_id }]);
    }
  };

  const updateWordStats = async (wordId, isCorrect) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const updates = {
      correct_count: isCorrect ? (word.correct_count || 0) + 1 : (word.correct_count || 0),
      incorrect_count: !isCorrect ? (word.incorrect_count || 0) + 1 : (word.incorrect_count || 0),
      status: isCorrect ? 'known' : 'learning'
    };

    const { error } = await supabase.from('words').update(updates).eq('id', wordId);
    if (!error) {
      setWords(words.map(w => w.id === wordId ? { ...w, ...updates } : w));
    }
  };

  const deleteWord = async (id) => {
    const { error } = await supabase.from('words').delete().eq('id', id);
    if (!error) setWords(words.filter(w => w.id !== id));
  };

  const navigateToVocab = (langId) => {
    setActiveLanguageId(langId);
    setCurrentPage('vocabulary');
  };

  return (
    <React.Fragment>
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        user={user}
        t={t}
        uiLanguage={uiLanguage}
        changeLanguage={changeLanguage}
      />
      
      <div className="app-container">
        <main>
          {authError && (
            <div className="auth-error-box">
              <strong>Auth Error:</strong> {authError}
              <button onClick={() => setAuthError(null)}>✖</button>
            </div>
          )}

          {!user && !loading ? (
            <section className="hero-section">
              <h1>{t.heroTitle}</h1>
              <p>{t.heroDesc}</p>
              <button className="btn btn-primary btn-large" onClick={() => document.querySelector('.btn-primary').click()}>
                {t.getStarted}
              </button>
            </section>
          ) : (
            <div className="fade-in">
              {user && (
                <div className="sub-nav">
                  <button className={currentPage === 'dashboard' || currentPage === 'vocabulary' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>{t.dashboard}</button>
                  <button className={currentPage === 'game' ? 'active' : ''} onClick={() => setCurrentPage('game')}>{t.gameMode}</button>
                  <button className={currentPage === 'discover' ? 'active' : ''} onClick={() => setCurrentPage('discover')}>{t.discover}</button>
                </div>
              )}

              {currentPage === 'dashboard' && (
                <Dashboard 
                  languages={languages} 
                  words={words}
                  addLanguage={addLanguage}
                  deleteLanguage={deleteLanguage}
                  onSelectLanguage={navigateToVocab}
                  isLoading={loading}
                  t={t}
                />
              )}
              
              {currentPage === 'vocabulary' && (
                <Vocabulary 
                  language={languages.find(l => l.id === activeLanguageId)}
                  words={words.filter(w => w.languageId === activeLanguageId)}
                  addWord={addWord}
                  deleteWord={deleteWord}
                  onBack={() => setCurrentPage('dashboard')}
                  isLoading={loading}
                  t={t}
                />
              )}

              {currentPage === 'game' && (
                <Game 
                  languages={languages}
                  words={words}
                  updateWordStats={updateWordStats}
                  isLoading={loading}
                  t={t}
                />
              )}

              {currentPage === 'discover' && (
                <Explore 
                  languages={languages}
                  addWord={addWord}
                  t={t}
                  uiLanguage={uiLanguage}
                  isLoading={loading}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </React.Fragment>
  );
}

export default App;
