import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function Header({ currentPage, setCurrentPage, user }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' or 'register'
  
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
        <h1 className="logo" onClick={() => setCurrentPage('dashboard')}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="14" r="3.5" fill="#2563eb"/>
            <rect x="14" y="6" width="8" height="20" rx="4" transform="rotate(-25 14 6)" fill="#2563eb"/>
          </svg>
        </h1>
        
        <nav className="nav-links">
          <button 
            className={currentPage === 'dashboard' || currentPage === 'vocabulary' ? 'active' : ''} 
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={currentPage === 'game' ? 'active' : ''} 
            onClick={() => setCurrentPage('game')}
          >
            Game Mode
          </button>
        </nav>

        <div className="auth-buttons">
          {!user ? (
            <>
              <button className="btn" onClick={() => openModal('login')}>Login</button>
              <button className="btn btn-primary" onClick={() => openModal('register')}>Register</button>
            </>
          ) : (
            <div className="user-profile">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}&background=8b5cf6&color=fff&rounded=true&size=36`} 
                alt="Profile" 
                className="profile-avatar"
              />
              <span className="profile-name">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              <button className="btn btn-danger" onClick={handleLogout} style={{ marginLeft: '10px', padding: '8px 16px', fontSize: '0.85rem' }}>Logout</button>
            </div>
          )}
        </div>
      </header>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h2>{modalType === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
            <p>
              {modalType === 'login' 
                ? 'Enter your details to log in to your account.' 
                : 'Registration is optional, but allows you to save progress across devices!'}
            </p>
            
            {error && <div style={{ color: '#ff4d4d', marginBottom: '15px', padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}
            
            <form onSubmit={handleAuth}>
              {modalType === 'register' && (
                <div className="form-group">
                  <label>Name (optional)</label>
                  <input 
                    type="text" 
                    placeholder="Your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
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
                {loading ? 'Processing...' : (modalType === 'login' ? 'Login' : 'Register')}
              </button>
            </form>

            <div className="divider">
              <span>OR</span>
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
              Sign in with Google
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
