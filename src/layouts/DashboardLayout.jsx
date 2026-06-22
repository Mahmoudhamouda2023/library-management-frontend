import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
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
    { to: staffBase, label: isAdmin ? dt('adminDashboard') : dt('librarianDashboard'), show: isAdmin || isLibrarian },
    { to: `${staffBase}/messages`, label: dt('messages'), show: isAdmin || isLibrarian },
    { to: `${staffBase}/notifications`, label: dt('notifications'), show: isAdmin || isLibrarian },
    { to: `${staffBase}/books`, label: dt('books'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage books') },
    { to: `${staffBase}/authors`, label: dt('authors'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage authors') },
    { to: `${staffBase}/categories`, label: dt('categories'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage categories') },
    { to: `${staffBase}/members`, label: dt('members'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage members') },
    { to: `${staffBase}/borrowings`, label: dt('borrowings'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage borrowings') },
    { to: `${staffBase}/reservations`, label: dt('reservations'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage reservations') },
    { to: `${staffBase}/fines`, label: dt('fines'), show: (isAdmin || isLibrarian) && hasPermission(user, 'manage fines') },
    { to: `${staffBase}/reports`, label: dt('reports'), show: (isAdmin || isLibrarian) && hasPermission(user, 'view reports') },
    { to: '/admin/books/pending', label: dt('pendingPublisherBooks'), show: isAdmin },
    { to: '/admin/publisher-requests', label: dt('publisherRequests'), show: isAdmin },
  ];

  const publisherLinks = [
    { to: '/publisher', label: dt('publisherPortal'), show: isPublisher },
    { to: '/publisher?tab=books', label: dt('myBooks'), show: isPublisher },
    { to: '/messages', label: dt('messages'), show: isPublisher },
    { to: '/notifications', label: dt('notifications'), show: isPublisher },
  ];

  const links = [
    { to: '/profile', label: dt('publicProfile'), show: true },
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
    <div className="app-shell" dir={dir}>
      <aside>
        <div className="dashboard-sidebar-head">
          <h2>{dt('librarySystem')}</h2>
          <button className="language-switch dashboard-language" onClick={toggleLanguage} type="button">
            <Languages size={16} />
            {dt('languageToggle')}
          </button>
        </div>

        <p className="user-card">
          {user?.name}
          <br />
          <small>{user?.email}</small>
          <br />
          <small>{roleLabel(user, dt)}</small>
        </p>

        <nav>
          <Link to="/" className="site-link">
            {dt('visitPublicSite')}
          </Link>

          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/librarian' || link.to === '/publisher'}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          {dt('logout')}
        </button>
      </aside>

      <main>
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
