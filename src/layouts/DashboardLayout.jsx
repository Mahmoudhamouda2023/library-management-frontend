import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  DollarSign,
  Globe2,
  Languages,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Repeat2,
  ShieldCheck,
  Tags,
  UserRound,
  Users,
} from 'lucide-react';
import { clearSession, getUser, apiRequest } from '../api/client.js';
import { hasPermission, hasRole } from '../auth/permissions.js';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function DashboardLayout() {
  const user = getUser();
  const navigate = useNavigate();
  const { dt, dir, toggleLanguage } = useDashboardText();

  const isAdmin = hasRole(user, 'admin');
  const isLibrarian = hasRole(user, 'librarian');
  const isPublisher = hasRole(user, 'publisher');
  const staffBase = isAdmin ? '/admin' : '/librarian';

  const staffLinks = [
    { to: staffBase, label: isAdmin ? dt('adminDashboard') : dt('librarianDashboard'), icon: <LayoutDashboard size={17} />, show: isAdmin || isLibrarian },
    { to: `${staffBase}/messages`, label: dt('messages'), icon: <MessageCircle size={17} />, show: isAdmin || isLibrarian },
    { to: `${staffBase}/notifications`, label: dt('notifications'), icon: <Bell size={17} />, show: isAdmin || isLibrarian },
    { to: `${staffBase}/books`, label: dt('books'), icon: <BookOpen size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage books') },
    { to: `${staffBase}/authors`, label: dt('authors'), icon: <UserRound size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage authors') },
    { to: `${staffBase}/categories`, label: dt('categories'), icon: <Tags size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage categories') },
    { to: `${staffBase}/members`, label: dt('members'), icon: <Users size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage members') },
    { to: `${staffBase}/borrowings`, label: dt('borrowings'), icon: <Repeat2 size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage borrowings') },
    { to: `${staffBase}/reservations`, label: dt('reservations'), icon: <CalendarCheck size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage reservations') },
    { to: `${staffBase}/fines`, label: dt('fines'), icon: <DollarSign size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'manage fines') },
    { to: `${staffBase}/reports`, label: dt('reports'), icon: <BarChart3 size={17} />, show: (isAdmin || isLibrarian) && hasPermission(user, 'view reports') },
    { to: '/admin/books/pending', label: dt('pendingPublisherBooks'), icon: <ShieldCheck size={17} />, show: isAdmin },
    { to: '/admin/publisher-requests', label: dt('publisherRequests'), icon: <Building2 size={17} />, show: isAdmin },
  ];

  const publisherLinks = [
    { to: '/publisher', label: dt('publisherPortal'), icon: <Building2 size={17} />, show: isPublisher },
    { to: '/publisher?tab=books', label: dt('myBooks'), icon: <BookOpen size={17} />, show: isPublisher },
    { to: '/messages', label: dt('messages'), icon: <MessageCircle size={17} />, show: isPublisher },
    { to: '/notifications', label: dt('notifications'), icon: <Bell size={17} />, show: isPublisher },
  ];

  const links = [
    { to: '/profile', label: dt('publicProfile'), icon: <UserRound size={17} />, show: true },
    ...(isPublisher ? publisherLinks : staffLinks),
  ].filter((link) => link.show !== false);

  async function logout() {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch {}

    clearSession();
    navigate('/login');
  }

  return (
    <div className="app-shell dashboard-shell" dir={dir}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-head">
          <Link to={staffBase} className="dashboard-brand">
            <span>L</span>
            <strong>{dt('librarySystem')}</strong>
          </Link>
          <button className="language-switch dashboard-language" onClick={toggleLanguage} type="button">
            <Languages size={16} />
            {dt('languageToggle')}
          </button>
        </div>

        <nav className="dashboard-nav">
          <Link to="/" className="site-link dashboard-site-link">
            <Globe2 size={17} />
            {dt('visitPublicSite')}
          </Link>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/librarian' || link.to === '/publisher'}
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <div className="dashboard-user-mini">
            <span>{initials(user?.name)}</span>
            <div>
              <strong>{user?.name || 'User'}</strong>
              <small>{user?.email}</small>
              <small>{roleLabel(user, dt)}</small>
            </div>
          </div>

          <button className="logout dashboard-logout" onClick={logout}>
            <LogOut size={17} />
            {dt('logout')}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

function roleLabel(user, dt) {
  if (hasRole(user, 'admin')) return dt('adminRole');
  if (hasRole(user, 'librarian')) return dt('librarianRole');
  if (hasRole(user, 'publisher')) return dt('publisherRole');
  if (hasRole(user, 'member')) return dt('memberRole');

  return dt('userRole');
}

function initials(name = '') {
  return String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}
