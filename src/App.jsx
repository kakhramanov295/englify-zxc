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
  const [uiLanguage, setUiLanguage] = useState(localStorage.getItem('uiLanguage') || 'en');
  
  const t = translations[uiLanguage];

  const changeLanguage = (lang) => {
    setUiLanguage(lang);
    localStorage.setItem('uiLanguage', lang);
  };
  
  // Real auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Handle OAuth errors returned in the URL hash
    if (window.location.hash && window.location.hash.includes('error=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = hashParams.get('error_description') || hashParams.get('error');
      if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (!session?.user) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data state
  const [languages, setLanguages] = useState([]);
  const [words, setWords] = useState([]);

  useEffect(() => {
    if (!user) {
      setLanguages([]);
      setWords([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      // Fetch languages
      const { data: langsData, error: langsError } = await supabase
        .from('languages')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (!langsError && langsData) {
        setLanguages(langsData);
      }

      // Fetch words
      const { data: wordsData, error: wordsError } = await supabase
        .from('words')
        .select('*')
        .order('created_at', { ascending: true });

      if (!wordsError && wordsData) {
        setWords(wordsData.map(w => ({
          ...w,
          languageId: w.language_id
        })));
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const addLanguage = async (name) => {
    if (!user) return alert("Please login first to save languages!");
    
    const newLang = { user_id: user.id, name };
    const { data, error } = await supabase
      .from('languages')
      .insert([newLang])
      .select();

    if (!error && data) {
      setLanguages([...languages, data[0]]);
    } else if (error) {
      alert("Error adding language: " + error.message);
    }
  };

  const deleteLanguage = async (id) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('languages')
      .delete()
      .eq('id', id);

    if (!error) {
      setLanguages(languages.filter(l => l.id !== id));
      setWords(words.filter(w => w.languageId !== id));
      if (activeLanguageId === id) {
        setActiveLanguageId(null);
        setCurrentPage('dashboard');
      }
    }
  };

  const addWord = async (languageId, original, translation) => {
    if (!user) return alert("Please login first to save words!");

    const newWord = { user_id: user.id, language_id: languageId, original, translation };
    const { data, error } = await supabase
      .from('words')
      .insert([newWord])
      .select();

    if (!error && data) {
      const added = data[0];
      setWords([...words, { ...added, languageId: added.language_id }]);
    } else if (error) {
      alert("Error adding word: " + error.message);
    }
  };

  const deleteWord = async (id) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id);

    if (!error) {
      setWords(words.filter(w => w.id !== id));
    }
  };

  const navigateToVocab = (langId) => {
    setActiveLanguageId(langId);
    setCurrentPage('vocabulary');
  };

  return (
    <div className="app-container">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        user={user}
        t={t}
        uiLanguage={uiLanguage}
        changeLanguage={changeLanguage}
      />
      
      <main>
        {authError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <strong>Auth Error:</strong> {authError}
            <button onClick={() => setAuthError(null)} style={{ float: 'right', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✖</button>
          </div>
        )}

        {!user && !loading ? (
          <section className="hero-section">
            <h1>{t.heroTitle}</h1>
            <p>{t.heroDesc}</p>
            <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }} onClick={() => document.querySelector('.btn-primary').click()}>
              {t.getStarted}
            </button>
          </section>
        ) : (
          <>
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
                isLoading={loading}
                t={t}
              />
            )}

            {currentPage === 'discover' && (
              <Explore 
                languages={languages}
                addWord={addWord}
                t={t}
                isLoading={loading}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
