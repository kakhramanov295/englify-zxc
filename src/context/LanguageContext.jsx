import React, { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  
  // Use a user-specific key for persistence
  const storageKey = user ? `language-master-data-${user.username}` : 'language-master-data-guest';
  const [languages, setLanguages] = useLocalStorage(storageKey, []);

  const addLanguage = (name) => {
    const newLang = {
      id: crypto.randomUUID(),
      name,
      words: []
    };
    setLanguages([...languages, newLang]);
  };

  const deleteLanguage = (id) => {
    setLanguages(languages.filter(lang => lang.id !== id));
  };

  const addWord = (langId, original, translation) => {
    setLanguages(languages.map(lang => {
      if (lang.id === langId) {
        return {
          ...lang,
          words: [...lang.words, { id: crypto.randomUUID(), original, translation }]
        };
      }
      return lang;
    }));
  };

  const deleteWord = (langId, wordId) => {
    setLanguages(languages.map(lang => {
      if (lang.id === langId) {
        return {
          ...lang,
          words: lang.words.filter(w => w.id !== wordId)
        };
      }
      return lang;
    }));
  };

  const updateWord = (langId, wordId, original, translation) => {
    setLanguages(languages.map(lang => {
      if (lang.id === langId) {
        return {
          ...lang,
          words: lang.words.map(w => 
            w.id === wordId ? { ...w, original, translation } : w
          )
        };
      }
      return lang;
    }));
  };

  const value = useMemo(() => ({
    languages, 
    addLanguage, 
    deleteLanguage, 
    addWord, 
    deleteWord, 
    updateWord 
  }), [languages]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguages() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguages must be used within a LanguageProvider');
  }
  return context;
}
