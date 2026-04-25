import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Header({ currentPage, setCurrentPage, user, t, uiLanguage, changeLanguage }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
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
  };

  return (
    <>
      <header className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 className="logo" onClick={() => setCurrentPage('dashboard')}>
            <svg width="124" height="32" viewBox="0 0 124 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7" cy="16" r="4" fill="#2563eb"/>
              <rect x="14" y="6" width="8" height="20" rx="4" transform="rotate(-25 14 6)" fill="#2563eb"/>
              <text x="42" y="17" fill="white" dominantBaseline="central" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.5px' }}>Lingvo</text>
            </svg>
          </h1>
          
          {user && (
            <nav className="nav-links">
              <button className={currentPage === 'dashboard' || currentPage === 'vocabulary' ? 'active' : ''} onClick={() => setCurrentPage('dashboard')}>{t.dashboard}</button>
              <button className={currentPage === 'game' ? 'active' : ''} onClick={() => setCurrentPage('game')}>{t.gameMode}</button>
              <button className={currentPage === 'discover' ? 'active' : ''} onClick={() => setCurrentPage('discover')}>{t.discover}</button>
            </nav>
          )}

          <div className="auth-buttons">
            <div className="lang-switcher">
              {['en', 'ru', 'uz'].map(lang => (
                <button 
                  key={lang}
                  className={`lang-btn ${uiLanguage === lang ? 'active' : ''}`}
                  onClick={() => changeLanguage(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {!user ? (
              <button className="btn btn-primary" onClick={() => openModal('login')}>{t.login}</button>
            ) : (
              <div className="user-profile">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}&background=2563eb&color=fff&rounded=true&size=32`} 
                  alt="Profile" 
                  className="profile-avatar"
                />
                <button className="logout-icon-btn" onClick={handleLogout} title={t.logout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </div>
            )}
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
            
            {error && <div style={{ color: '#ff4d4d', marginBottom: '15px', padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
            
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
                {loading ? t.processing : (modalType === 'login' ? t.login : t.register)}
              </button>
            </form>

            <div className="divider">
              <span>{t.or}</span>
            </div>
            
            <button 
              type="button" 
              className="btn btn-google" 
              style={{ width: '100%' }} 
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
