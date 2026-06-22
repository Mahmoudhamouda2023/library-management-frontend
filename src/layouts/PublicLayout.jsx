import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronDown,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCircle,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { apiRequest, clearSession, getToken, getUser } from '../api/client.js';
import { defaultRouteFor, hasDashboardAccess } from '../utils/routes.js';
import { personImageUrl } from '../utils/media.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import NotificationDropdown from '../components/NotificationDropdown.jsx';
import MessageShortcut from '../components/MessageShortcut.jsx';

export default function PublicLayout() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();
  const { t, dir, toggleLanguage } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const avatar = personImageUrl(user);
  const primaryRole = getPrimaryRole(user);
  const isStaff = primaryRole === 'admin' || primaryRole === 'librarian';
  const isPublisher = primaryRole === 'publisher';
  const isMember = primaryRole === 'member';
  const hasDashboard = hasDashboardAccess(user);
  const accountRef = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  async function logout() {
    try {
      await apiRequest('/logout', { method: 'POST' });
    } catch {}

    clearSession();
    navigate('/');
  }

  return (
    <div className="public-shell official-library-theme" dir={dir}>
      <div className="top-ribbon">
        <div className="public-container top-ribbon-inner">
          <span>{t('topRibbon')}</span>
          <div className="top-ribbon-links">
            <Link to="/catalog">{t('advancedSearch')}</Link>
            <Link to="/login">{t('staffLogin')}</Link>
            <button type="button" onClick={toggleLanguage}>{t('languageButton')}</button>
          </div>
        </div>
      </div>

      <header className="public-header">
        <div className="public-container public-header-inner">
          <Link to="/" className="brand professional-brand" aria-label={t('home')}>
            <span className="brand-mark"><BookOpen size={26} /></span>
            <span>
              <strong>{t('brandName')}</strong>
              <small>{t('brandSubtitle')}</small>
            </span>
          </Link>

          <nav className="public-nav" aria-label="Public website links">
            <NavLink to="/" end>{t('home')}</NavLink>
            <NavLink to="/catalog">{t('catalog')}</NavLink>
            <NavLink to="/catalog?available=true">{t('availableBooks')}</NavLink>
            <NavLink to="/sections">{t('librarySections')}</NavLink>
            <NavLink to="/authors">{t('authorsNav')}</NavLink>
            {!isStaff && <NavLink to="/publisher-services">{t('publisherServices')}</NavLink>}
          </nav>

          <div className="public-actions">
            <Link className="quick-search" to="/catalog" title={t('quickSearchTitle')}>
              <Search size={18} />
            </Link>
            {token ? (
              <>
                <MessageShortcut />
                <NotificationDropdown />

                <div className="account-dropdown" ref={accountRef}>
                  <button
                    type="button"
                    className="account-trigger"
                    onClick={() => setAccountOpen((value) => !value)}
                    aria-expanded={accountOpen}
                  >
                    <span className="header-avatar">
                      {avatar ? <img src={avatar} alt={user?.name || t('account')} /> : <UserRound size={18} />}
                    </span>
                    <span>{shortName(user?.name || user?.email || t('account'))}</span>
                    <ChevronDown size={16} />
                  </button>

                  {accountOpen && <div className="account-menu-card">
                    <Link to="/profile" onClick={() => setAccountOpen(false)}><UserCircle size={18} /> {t('myProfile')}</Link>
                    {hasDashboard && <Link to={defaultRouteFor(user)} onClick={() => setAccountOpen(false)}><LayoutDashboard size={18} /> {t('dashboard')}</Link>}
                    {isPublisher && <Link to="/publisher?tab=books" onClick={() => setAccountOpen(false)}><FolderOpen size={18} /> {t('myLibrary')}</Link>}
                    {isMember && <Link to="/my?tab=borrowings" onClick={() => setAccountOpen(false)}><FolderOpen size={18} /> {t('myLibrary')}</Link>}
                    <Link to="/messages" onClick={() => setAccountOpen(false)}><MessageCircle size={18} /> {t('messages')}</Link>
                    <Link to="/notifications" onClick={() => setAccountOpen(false)}><Bell size={18} /> {t('notifications')}</Link>
                    {isPublisher && <Link to="/publisher?tab=books" onClick={() => setAccountOpen(false)}><UploadCloud size={18} /> {t('uploadMyBook')}</Link>}
                    {isMember && <Link to="/publisher-services" onClick={() => setAccountOpen(false)}><UploadCloud size={18} /> {t('publisherServices')}</Link>}
                    <Link to="/profile?tab=settings" onClick={() => setAccountOpen(false)}><Settings size={18} /> {t('settings')}</Link>
                    <button type="button" onClick={logout}><LogOut size={18} /> {t('logout')}</button>
                  </div>}
                </div>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login"><LogIn size={17} /> {t('login')}</Link>
                <Link className="nav-cta" to="/register"><UserPlus size={17} /> {t('register')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="public-footer">
        <div className="public-container footer-grid">
          <div>
            <h3>{t('footerTitle')}</h3>
            <p>{t('footerText')}</p>
          </div>
          <div>
            <h4>{t('quickLinks')}</h4>
            <Link to="/catalog">{t('catalog')}</Link>
            <Link to="/sections">{t('librarySections')}</Link>
            <Link to="/authors">{t('authorsNav')}</Link>
            {!isStaff && <Link to="/publisher-services">{t('publisherServices')}</Link>}
            <Link to="/login">{t('systemLogin')}</Link>
            <Link to="/register">{t('createAccount')}</Link>
          </div>
          <div>
            <h4>{t('systemStandards')}</h4>
            <span><ShieldCheck size={16} /> {t('responsiveDesign')}</span>
            <span><ShieldCheck size={16} /> {t('dataTableAdmin')}</span>
            <span><ShieldCheck size={16} /> {t('techStack')}</span>
          </div>
        </div>
        <div className="footer-bottom">{t('copyright')}</div>
      </footer>
    </div>
  );
}

function shortName(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > 14 ? `${text.slice(0, 14)}...` : text;
}

function getPrimaryRole(user) {
  const roles = user?.roles || [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('librarian')) return 'librarian';
  if (roles.includes('publisher')) return 'publisher';
  if (roles.includes('member')) return 'member';
  return 'user';
}
