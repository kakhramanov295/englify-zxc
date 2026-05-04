import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguages } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

function Profile({ t, uiLanguage }) {
  const { user: currentUser } = useAuth();
  const { languages: myLanguages, words: myWords, userUid: myUid } = useLanguages();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Determine which data to show
  const isViewingSelf = !searchedUser;
  const displayUser = isViewingSelf ? currentUser : searchedUser.profile;
  const displayLanguages = isViewingSelf ? myLanguages : searchedUser.languages;
  const displayWords = isViewingSelf ? myWords : searchedUser.words;
  const displayUid = isViewingSelf ? myUid : searchedUser.uid;

  const totalWords = displayWords.length;
  const totalCorrect = displayWords.reduce((acc, w) => acc + (w.correct_count || 0), 0);
  const knownWords = displayWords.filter(w => w.status === 'known').length;
  const hardWords = displayWords.filter(w => w.status === 'hard').length;

  const tStrings = {
    en: { learning: "Languages learning", words: "Total words", guessed: "Total progress", known: "Mastered", hard: "Needs work", friendLanguages: "Friend's Languages" },
    ru: { learning: "Изучаемые языки", words: "Всего слов", guessed: "Общий прогресс", known: "Освоено", hard: "Сложные слова", friendLanguages: "Языки друга" },
    uz: { learning: "O'rganilayotgan tillar", words: "Jami so'zlar", guessed: "Umumiy natija", known: "O'zlashtirilgan", hard: "Qiyin so'zlar", friendLanguages: "Do'st tillari" }
  };
  const profileT = tStrings[uiLanguage] || tStrings.en;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (searchQuery.trim() === myUid) {
      setSearchedUser(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // 1. Find the user settings by UID
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('user_id, uid')
        .eq('uid', searchQuery.trim().toUpperCase())
        .single();

      if (settingsError || !settings) {
        throw new Error(t.userNotFound);
      }

      // 2. Fetch the user's basic info (from auth table via rpc or just use dummy info if not accessible)
      // Since we can't easily access auth.users, we might want to store names in user_settings too.
      // For now, let's assume we can get basic info or just show UID.
      
      // 3. Fetch languages and words
      const [langsRes, wordsRes] = await Promise.all([
        supabase.from('languages').select('*').eq('user_id', settings.user_id).order('created_at'),
        supabase.from('words').select('*').eq('user_id', settings.user_id).order('created_at')
      ]);

      setSearchedUser({
        uid: settings.uid,
        profile: { 
          id: settings.user_id,
          email: '---', // Privacy
          user_metadata: { full_name: `User ${settings.uid}` } 
        },
        languages: langsRes.data || [],
        words: wordsRes.data || []
      });
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const copyUid = () => {
    navigator.clipboard.writeText(displayUid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString(uiLanguage === 'ru' ? 'ru-RU' : uiLanguage === 'uz' ? 'uz-UZ' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-page fade-in">
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-bar">
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" disabled={searchLoading} className="btn btn-primary">
            {searchLoading ? t.processing : t.searchUser}
          </button>
        </form>
        {searchError && <p className="search-error">{searchError}</p>}
        {!isViewingSelf && (
          <button className="btn btn-secondary" onClick={() => { setSearchedUser(null); setSearchQuery(''); }}>
            ← {t.backToMyProfile}
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser?.user_metadata?.full_name || displayUser?.email?.split('@')[0] || 'User')}&background=${isViewingSelf ? '2563eb' : 'e91e63'}&color=fff&rounded=true&size=128`} 
            alt="Avatar" 
            className="profile-avatar-xl"
          />
          <div className="profile-main-info">
            <h2>
              {isViewingSelf 
                ? (displayUser?.user_metadata?.full_name || displayUser?.email?.split('@')[0])
                : (t.foundUserStats + ': ' + displayUid)}
            </h2>
            {isViewingSelf && <p className="profile-email">{displayUser?.email}</p>}
            <div className="uid-section">
              <span className="uid-label">UID:</span>
              <code className="uid-value">{displayUid || '---'}</code>
              <button className={`btn-icon ${copied ? 'copied' : ''}`} onClick={copyUid} title={t.copyUid}>
                {copied ? '✓' : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
            {isViewingSelf && (
              <p className="member-since">
                {t.memberSince}: <strong>{formatDate(displayUser?.created_at)}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="profile-stats-grid">
          <div className="stat-item">
            <span className="stat-value">{displayLanguages.length}</span>
            <span className="stat-label">{profileT.learning}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalWords}</span>
            <span className="stat-label">{profileT.words}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{totalCorrect}</span>
            <span className="stat-label">{profileT.guessed}</span>
          </div>
        </div>

        <div className="profile-details">
          <div className="progress-section">
            <div className="progress-info">
              <span>{profileT.known}</span>
              <span>{knownWords} / {totalWords}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill known" 
                style={{ width: `${totalWords > 0 ? (knownWords / totalWords) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-info">
              <span>{profileT.hard}</span>
              <span>{hardWords} / {totalWords}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill hard" 
                style={{ width: `${totalWords > 0 ? (hardWords / totalWords) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          {!isViewingSelf && displayLanguages.length > 0 && (
            <div className="friend-languages-section">
              <h3>{profileT.friendLanguages}</h3>
              <div className="mini-grid">
                {displayLanguages.map(lang => (
                  <div key={lang.id} className="mini-card">
                    {lang.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
