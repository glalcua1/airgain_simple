import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const authed = typeof window !== 'undefined' && window.localStorage.getItem('airgain_auth') === '1';
  const hideTopbar = location.pathname === '/login';
  const showSidebar = !hideTopbar;
  const initialCollapsed = typeof window !== 'undefined' && window.localStorage.getItem('airgain_sidebar_collapsed') === '1';
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const userName = typeof window !== 'undefined' && (window.localStorage.getItem('airgain_user_name') || 'User');
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  function setCollapsedAndPersist(v) {
    setCollapsed(v);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('airgain_sidebar_collapsed', v ? '1' : '0');
    }
  }

  function logout() {
    window.localStorage.removeItem('airgain_auth');
    navigate('/login');
  }

  useEffect(() => {
    function onDocClick(e) {
      const inUser = userRef.current && userRef.current.contains(e.target);
      if (inUser) return;
      setUserOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') {
        setUserOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const [currency, setCurrency] = useState(
    (typeof window !== 'undefined' && window.localStorage.getItem('airgain_currency')) || 'VND'
  );

  function onCurrencyChange(e) {
    const v = e.target.value;
    setCurrency(v);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('airgain_currency', v);
      window.dispatchEvent(new Event('airgain_currency_changed'));
    }
  }

  return (
    <>
      {!hideTopbar && (
        <header className="topbar">
          <div className="brand">
            AirGain <span className="brand-sep">|</span> <span className="brand-context">Vietnam Airlines</span>
          </div>
          <nav className="nav-actions">
            <div className="currency-select-wrap">
              <span className="currency-label">Currency</span>
              <select
                className="currency-select"
                value={currency}
                onChange={onCurrencyChange}
                aria-label="Currency"
                title="Currency"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <button className="btn whats-btn" title="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="Notifications" style={{ color: '#ffffff' }}>
                <path d="M14.857 17.082a24.255 24.255 0 0 1-5.714 0M5.586 17.082A8.967 8.967 0 0 0 7.5 11.25V9a4.5 4.5 0 1 1 9 0v2.25c0 2.205.86 4.323 2.414 5.832M5.586 17.082H3l1.76-1.76A5.25 5.25 0 0 0 6.75 11.25m10.664 5.832H21l-1.76-1.76a5.25 5.25 0 0 1-1.99-4.072" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.75 17.25a2.25 2.25 0 1 0 4.5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="whats-dot" />
            </button>
            {authed ? (
              <div className="user-menu" ref={userRef}>
                <button
                  className="btn user-btn"
                  onClick={() => setUserOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={userOpen ? 'true' : 'false'}
                  title="Account"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="Account" style={{ color: '#ffffff' }}>
                    <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{userName}</span>
                  <span style={{ color: '#e5e7eb', marginLeft: 4 }}>▾</span>
                </button>
                {userOpen && (
                  <div className="popover-menu" role="menu" aria-label="User menu" style={{ minWidth: 200 }}>
                    <button className="menu-item" onClick={logout} role="menuitem">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="btn primary" to="/login">Login</Link>
            )}
          </nav>
        </header>
      )}
      {showSidebar && (
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsedAndPersist(!collapsed)}
          topbarHidden={hideTopbar}
        />
      )}
      <main
        className={`page${hideTopbar ? ' page-login' : ''}${showSidebar ? ' with-sidebar' : ''}`}
        style={showSidebar ? { ['--sidebar-w']: collapsed ? '72px' : '240px' } : undefined}
      >
        {children}
      </main>
    </>
  );
}


