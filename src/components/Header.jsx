import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguages } from '../context/LanguageContext';

function Header({ setCurrentPage, user, t, uiLanguage, changeLanguage }) {
  const { languages, words, userUid } = useLanguages();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uidCopied, setUidCopied] = useState(false);

  const tStrings = {
    en: { learning: "Languages learning: ", guessed: "Words guessed: ", changeLanguage: "Change Language", acc: "Account" },
    ru: { learning: "Изучает языков: ", guessed: "Угадано слов: ", changeLanguage: "Сменить язык", acc: "Аккаунт" },
    uz: { learning: "O'rganilayotgan tillar: ", guessed: "Topilgan so'zlar: ", changeLanguage: "Tilni o'zgartirish", acc: "Hisob" }
  };
  const profileT = tStrings[uiLanguage] || tStrings.en;
  const totalCorrectAnswers = words.reduce((acc, w) => acc + (w.correct_count || 0), 0);

  const copyUid = async () => {
    if (!userUid) return;
    try {
      await navigator.clipboard.writeText(userUid);
      setUidCopied(true);
      setTimeout(() => setUidCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = userUid;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setUidCopied(true);
      setTimeout(() => setUidCopied(false), 2000);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setIsMenuOpen(false); // Close menu if open
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (modalType === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setIsModalOpen(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <header className="header">
        <div className="header-content" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <h1 className="logo" onClick={() => setCurrentPage('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="16" r="4" fill="#2563eb"/>
              <rect x="14" y="6" width="8" height="20" rx="4" transform="rotate(-25 14 6)" fill="#2563eb"/>
            </svg>
            <span className="logo-text">LangStudy</span>
          </h1>

          {/* Desktop Navigation */}
          <div className="desktop-nav">
            <div className="lang-switcher">
              {['en', 'ru', 'uz'].map(lang => (
                <button 
                  key={lang}
                  className={`lang-btn ${uiLanguage === lang ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang)}
                >{lang.toUpperCase()}</button>
              ))}
            </div>

            {!user ? (
              <button className="btn btn-primary" onClick={() => openModal('login')}>{t.login}</button>
            ) : (
              <div className="user-profile" onClick={() => setCurrentPage('profile')} style={{ cursor: 'pointer' }}>
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}&background=2563eb&color=fff&rounded=true&size=32`} 
                  alt="Profile" 
                  className="profile-avatar"
                />
                <button className="logout-icon-btn" onClick={(e) => { e.stopPropagation(); handleLogout(); }} title={t.logout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </div>
            )}
          </div>

          {/* Hamburger Button */}
          <button className={`burger-menu ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu} aria-label="Toggle Menu" style={{ marginLeft: 'auto', order: 99 }}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu-dropdown ${isMenuOpen ? 'show' : ''}`}>
          <div className="mobile-menu-content google-style">
            {user && (
              <>
                <div className="mobile-user-info">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}&background=e91e63&color=fff&rounded=true&size=48`} 
                    alt="Profile" 
                    className="profile-avatar-large"
                  />
                  <div className="user-details" onClick={() => { setCurrentPage('profile'); setIsMenuOpen(false); }} style={{ cursor: 'pointer' }}>
                    <span className="user-name">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                    <span className="user-email">{user.email}</span>
                    <span className="user-stats">
                      {profileT.learning} <strong>{languages.length}</strong><br/>
                      {profileT.guessed} <strong>{totalCorrectAnswers}</strong>
                    </span>
                  </div>
                </div>
                <div className="menu-divider"></div>
              </>
            )}

            <div className="mobile-actions-list">
              {user && (
                <div className="menu-item no-hover">
                  <svg className="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span>{profileT.acc}</span>
                </div>
              )}
              
              <div className="menu-item lang-selector-item">
                <svg className="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <div className="lang-switcher-inline">
                  <span>{profileT.changeLanguage}</span>
                  <div className="inline-lang-btns">
                    {['en', 'ru', 'uz'].map(lang => (
                      <button 
                        key={lang}
                        className={`lang-btn ${uiLanguage === lang ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); changeLanguage(lang); setIsMenuOpen(false); }}
                      >{lang.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>

              {user ? (
                <div className="menu-item" onClick={handleLogout}>
                  <svg className="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  <span>{t.logout}</span>
                </div>
              ) : (
                <div className="menu-item" onClick={() => openModal('login')}>
                  <svg className="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  <span>{t.login}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2>{modalType === 'login' ? t.welcomeBack : t.createAccount}</h2>
            <p>
              {modalType === 'login' ? t.authDesc : t.regDesc}
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleAuth}>
              {modalType === 'register' && (
                <div className="form-group">
                  <label>{t.name}</label>
                  <input 
                    type="text" 
                    placeholder="..." 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>{t.email}</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.password}</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '10px' }} disabled={loading}>
                {loading ? t.processing : (modalType === 'login' ? t.login : t.register)}
              </button>
            </form>

            <div className="divider">
              <span>{t.or}</span>
            </div>
            
            <button 
              type="button" 
              className="btn btn-google w-full" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              {t.googleSignIn}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
