import { Link, useLocation } from 'react-router-dom';
import React from 'react';

export default function Sidebar({ collapsed, onToggle, topbarHidden = false }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const w = collapsed ? 72 : 240;
  return (
    <aside
      className={`sidebar${collapsed ? ' collapsed' : ''}`}
      style={{ width: w, top: topbarHidden ? 0 : 'var(--topbar-h)' }}
    >
      <div className="sidebar-inner">
        <div className="sidebar-section">
          <Link to="/fare-trends" className={`sidebar-item ${isActive('/fare-trends') ? 'active' : ''}`} title="Fare Trends">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 20h16" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 16l3-6 3 4 3-7 3 9" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span className="label">Fare Trends</span>}
          </Link>
          <Link to="/fare-evolution" className={`sidebar-item ${isActive('/fare-evolution') ? 'active' : ''}`} title="Fare Evolution">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16v14H4z" stroke="#111827" strokeWidth="1.5" />
              <path d="M4 11h16" stroke="#111827" strokeWidth="1.5" />
            </svg>
            {!collapsed && <span className="label">Fare Evolution</span>}
          </Link>
          <Link to="/schedules" className={`sidebar-item ${isActive('/schedules') ? 'active' : ''}`} title="Schedules">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="5" width="16" height="14" rx="2" stroke="#111827" strokeWidth="1.5"/>
              <path d="M4 9h16" stroke="#111827" strokeWidth="1.5"/>
            </svg>
            {!collapsed && <span className="label">Schedules</span>}
          </Link>
          <Link to="/capacity" className={`sidebar-item ${isActive('/capacity') ? 'active' : ''}`} title="Capacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 18h16M6 14h12M8 10h8M10 6h4" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {!collapsed && <span className="label">Capacity</span>}
          </Link>
          <Link to="/events" className={`sidebar-item ${isActive('/events') ? 'active' : ''}`} title="Events">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#111827" strokeWidth="1.5"/>
              <path d="M3 10h18" stroke="#111827" strokeWidth="1.5"/>
              <circle cx="8" cy="14" r="1.5" fill="#111827"/>
              <circle cx="12" cy="14" r="1.5" fill="#111827"/>
              <circle cx="16" cy="14" r="1.5" fill="#111827"/>
            </svg>
            {!collapsed && <span className="label">Events</span>}
          </Link>
          <Link to="/parity" className={`sidebar-item ${isActive('/parity') ? 'active' : ''}`} title="Parity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 10l6-6 6 6v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8z" stroke="#111827" strokeWidth="1.5"/>
              <path d="M9 13h6" stroke="#111827" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {!collapsed && <span className="label">Parity</span>}
            {!collapsed && <span className="label" style={{ marginLeft: 'auto', color: '#ca8a04' }}>🔒</span>}
          </Link>
        </div>

        <div className="sidebar-section grow" />

        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle navigation">
          {collapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          {!collapsed && <span className="label">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}


