import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('air.user@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/fare-trends';

  useEffect(() => {
    document.title = 'AirGain | Login';
  }, []);

  function submit(e) {
    e.preventDefault();
    window.localStorage.setItem('airgain_auth', '1');
    window.localStorage.setItem('airgain_user_name', 'Air User');
    navigate(from, { replace: true });
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <form className="form card glass" onSubmit={submit}>
          <img className="login-logo" src="/Vivid-Lavender.png" alt="AirGain" />
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            <span>Welcome to </span>
            <span style={{ fontWeight: 800 }}>AirGain</span>
          </div>
          <div style={{ height: 16 }} />
          <div className="field">
            <label style={{ fontSize: 12 }}>Email</label>
            <input className="input" style={{ fontSize: 14 }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <div className="field">
            <label style={{ fontSize: 12 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ fontSize: 14, paddingRight: 36 }}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#667085'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9.88 9.88 14.12 14.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M14.12 9.88 9.88 14.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
            <div>
              <a href="#" onClick={e => e.preventDefault()} className="muted" style={{ fontSize: 12, textDecoration: 'underline' }}>
                Forgot password?
              </a>
            </div>
          </div>
          <button className="btn primary" type="submit" style={{ width: '100%', marginTop: 6 }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}


