import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { translations } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [uiLanguage, setUiLanguage] = useState('en');
  const [activeLanguageId, setActiveLanguageId] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [words, setWords] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const t = useMemo(() => translations[uiLanguage] || translations.en, [uiLanguage]);



  const fetchUserSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        if (data.preferred_language) setUiLanguage(data.preferred_language);
        if (data.active_language_id) setActiveLanguageId(data.active_language_id);
      } else if (error && error.code === 'PGRST116') {
        // No settings yet, create default
        await supabase.from('user_settings').insert([{ 
          user_id: userId, 
          preferred_language: 'en' 
        }]);
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
    }
  };

  const fetchData = async (userId) => {
    setDataLoading(true);
    try {
      const [langsRes, wordsRes] = await Promise.all([
        supabase.from('languages').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('words').select('*').eq('user_id', userId).order('created_at')
      ]);

      if (langsRes.data) setLanguages(langsRes.data);
      if (wordsRes.data) {
        setWords(wordsRes.data.map(w => ({ ...w, languageId: w.language_id })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Load settings and data from Supabase or LocalStorage
  useEffect(() => {
    if (authLoading) return;

    const initialize = async () => {
      if (user) {
        // Authenticated user: Fetch from Supabase
        await fetchUserSettings(user.id);
        await fetchData(user.id);
      } else {
        // Guest user: Fetch from LocalStorage
        const savedUiLang = localStorage.getItem('preferred_language') || 'en';
        const savedActiveLangId = localStorage.getItem('activeLanguageId');
        const savedLangs = JSON.parse(localStorage.getItem('languages') || '[]');
        const savedWords = JSON.parse(localStorage.getItem('words') || '[]');
        
        setUiLanguage(savedUiLang);
        setActiveLanguageId(savedActiveLangId);
        setLanguages(savedLangs);
        setWords(savedWords);
      }
      setIsInitialized(true);
    };

    initialize();
  }, [user, authLoading]);

  const changeUiLanguage = async (lang) => {
    setUiLanguage(lang);
    if (user) {
      await supabase.from('user_settings').upsert({ 
        user_id: user.id, 
        preferred_language: lang 
      }, { onConflict: 'user_id' });
    } else {
      localStorage.setItem('preferred_language', lang);
    }
  };

  const changeActiveLanguage = async (langId) => {
    setActiveLanguageId(langId);
    if (user) {
      await supabase.from('user_settings').upsert({ 
        user_id: user.id, 
        active_language_id: langId 
      }, { onConflict: 'user_id' });
    } else {
      if (langId) localStorage.setItem('activeLanguageId', langId);
      else localStorage.removeItem('activeLanguageId');
    }
  };

  const addLanguage = async (name) => {
    if (user) {
      const { data } = await supabase.from('languages').insert([{ user_id: user.id, name }]).select();
      if (data) setLanguages(prev => [...prev, data[0]]);
    } else {
      const newLang = { id: crypto.randomUUID(), name, created_at: new Date().toISOString() };
      const updated = [...languages, newLang];
      setLanguages(updated);
      localStorage.setItem('languages', JSON.stringify(updated));
    }
  };

  const deleteLanguage = async (id) => {
    if (user) {
      const { error } = await supabase.from('languages').delete().eq('id', id);
      if (!error) {
        setLanguages(prev => prev.filter(l => l.id !== id));
        setWords(prev => prev.filter(w => w.languageId !== id));
        if (activeLanguageId === id) changeActiveLanguage(null);
      }
    } else {
      const updatedLangs = languages.filter(l => l.id !== id);
      const updatedWords = words.filter(w => w.languageId !== id);
      setLanguages(updatedLangs);
      setWords(updatedWords);
      localStorage.setItem('languages', JSON.stringify(updatedLangs));
      localStorage.setItem('words', JSON.stringify(updatedWords));
      if (activeLanguageId === id) changeActiveLanguage(null);
    }
  };

  const addWord = async (languageId, original, translation) => {
    if (user) {
      const { data } = await supabase.from('words').insert([{ 
        user_id: user.id, 
        language_id: languageId, 
        original, 
        translation,
        status: 'new'
      }]).select();
      if (data) {
        const added = data[0];
        setWords(prev => [...prev, { ...added, languageId: added.language_id }]);
      }
    } else {
      const newWord = { 
        id: crypto.randomUUID(), 
        languageId, 
        original, 
        translation, 
        status: 'new',
        created_at: new Date().toISOString() 
      };
      const updated = [...words, newWord];
      setWords(updated);
      localStorage.setItem('words', JSON.stringify(updated));
    }
  };

  const deleteWord = async (id) => {
    if (user) {
      const { error } = await supabase.from('words').delete().eq('id', id);
      if (!error) setWords(prev => prev.filter(w => w.id !== id));
    } else {
      const updated = words.filter(w => w.id !== id);
      setWords(updated);
      localStorage.setItem('words', JSON.stringify(updated));
    }
  };

  const updateWordStats = async (wordId, isCorrect) => {
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const newCorrect = isCorrect ? (word.correct_count || 0) + 1 : (word.correct_count || 0);
    const newIncorrect = !isCorrect ? (word.incorrect_count || 0) + 1 : (word.incorrect_count || 0);
    
    let newStatus = 'learning';
    if (!isCorrect && newIncorrect >= 2) newStatus = 'hard';
    else if (isCorrect && newCorrect >= 3) newStatus = 'known';
    else if (isCorrect) newStatus = 'learning';

    const updates = {
      correct_count: newCorrect,
      incorrect_count: newIncorrect,
      status: newStatus,
      last_seen: new Date().toISOString()
    };

    if (user) {
      const { error } = await supabase.from('words').update(updates).eq('id', wordId);
      if (!error) {
        setWords(prev => prev.map(w => w.id === wordId ? { ...w, ...updates } : w));
      }
    } else {
      const updated = words.map(w => w.id === wordId ? { ...w, ...updates } : w);
      setWords(updated);
      localStorage.setItem('words', JSON.stringify(updated));
    }
  };

  const value = {
    uiLanguage,
    activeLanguageId,
    languages,
    words,
    t,
    isLoading: !isInitialized || dataLoading,
    changeUiLanguage,
    changeActiveLanguage,
    addLanguage,
    deleteLanguage,
    addWord,
    deleteWord,
    updateWordStats
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguages() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguages must be used within a LanguageProvider');
  }
  return context;
}
