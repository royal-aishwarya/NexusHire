import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, FileText, Mic, Brain, BarChart3, Briefcase,
  LogOut, Menu, X, Zap, ChevronRight
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: FileText,        label: 'Resume',    path: '/app/resume' },
  { icon: Briefcase,       label: 'Job Matching', path: '/app/jobs' },
  { icon: Mic,             label: 'Interview', path: '/app/interview' },
  { icon: Brain,           label: 'Assessment',path: '/app/assessment' },
  { icon: BarChart3,       label: 'Feedback',  path: '/app/feedback' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="app-layout">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ display: 'none', position: 'fixed', top: 16, left: 16, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: 8, color: 'var(--text-primary)', cursor: 'pointer' }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className="sidebar" style={{ transform: mobileOpen ? 'translateX(0)' : undefined }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 700,
                background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                NEXUSHIRE
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                AI PLATFORM
              </div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '0 24px 20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 8 }}>
          <div style={{
            background: 'rgba(0,212,255,0.05)', border: '1px solid var(--border-subtle)',
            borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#fff'
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Candidate</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 4 }}>
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path);
            return (
              <button key={path} onClick={() => handleNav(path)}
                className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={18} />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight size={14} style={{ color: 'var(--neon-blue)' }} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={handleLogout} className="nav-item btn-danger"
            style={{ width: '100%', borderRadius: 8 }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
