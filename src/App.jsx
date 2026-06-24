import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Search, Mail, Settings, Zap, Bell, LayoutDashboard, Briefcase, Target, User } from 'lucide-react';
import useStore from './store';
import SettingsPage from './pages/SettingsPage';
import Outreach from './pages/Outreach';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';
import ToastStack from './components/ToastStack';

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',    icon: Briefcase,       label: 'Job Feed' },
  { to: '/tracker', icon: Target,          label: 'Tracker' },
  { to: '/outreach',icon: Mail,            label: 'Outreach Hub' },
  { to: '/profile', icon: User,            label: 'Profile & Resume' },
];

const PAGE_TITLES = {
  '/':         'Dashboard',
  '/jobs':     'Job Feed',
  '/tracker':  'Application Tracker',
  '/outreach': 'Outreach Hub',
  '/profile':  'Profile & Resume',
  '/settings': 'Settings',
};

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} color="white" />
        </div>
        <span className="sidebar-logo-text">JobReach</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
            {badge && <span className="sidebar-badge">{badge}</span>}
          </NavLink>
        ))}

        <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <Settings size={18} />
          Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color: 'white',
          }}>AJ</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Alex Johnson</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Software Developer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const location = useLocation();
  // For /jobs/:id, show the parent label
  const pageTitle = PAGE_TITLES[location.pathname]
    ?? (location.pathname.startsWith('/jobs/') ? 'Job Detail' : 'JobReach');

  return (
    <header className="topbar">
      <span className="topbar-title">{pageTitle}</span>
      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={15} />
          <input placeholder="Search jobs, companies…" />
        </div>
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-brand-primary)',
          }} />
        </button>
        <div className="avatar-btn">AJ</div>
      </div>
    </header>
  );
}

export default function App() {
  const toasts = useStore(s => s.toasts);

  return (
    <div className="app-shell">
      {/* Glow Orbs */}
      <div className="glow-orb" style={{ width: 600, height: 600, background: 'var(--color-brand-primary)', top: -200, left: -100 }} />
      <div className="glow-orb" style={{ width: 400, height: 400, background: 'var(--color-brand-accent)', bottom: -100, right: -50 }} />

      <Sidebar />

      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/jobs"     element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/tracker"  element={<Tracker />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/profile"  element={<Profile />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
