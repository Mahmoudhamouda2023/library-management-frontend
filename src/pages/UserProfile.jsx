import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Crown,
  Edit3,
  FolderOpen,
  Gauge,
  Globe2,
  KeyRound,
  LibraryBig,
  Mail,
  MapPin,
  MessageCircle,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { apiRequest, getUser, setSession } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { personImageUrl } from '../utils/media.js';
import { defaultRouteFor, hasDashboardAccess } from '../utils/routes.js';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function UserProfile() {
  const { dt, dir } = useDashboardText();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview');
  const [profile, setProfile] = useState(() => normalizeUser(getUser()));
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(() => profileForm(normalizeUser(getUser())));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const primaryRole = useMemo(() => getPrimaryRole(profile), [profile]);
  const roleInfo = useMemo(() => rolePresentation(primaryRole, dt), [primaryRole, dt]);
  const facts = useMemo(() => profileFacts(profile, primaryRole, dt), [profile, primaryRole, dt]);
  const metrics = useMemo(() => roleMetrics(summary, profile, primaryRole, dt), [summary, profile, primaryRole, dt]);
  const actions = useMemo(() => roleActions(primaryRole, dt), [primaryRole, dt]);
  const photo = imagePreview(form.photo) || personImageUrl(profile);
  const hasDashboard = hasDashboardAccess(profile);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');

      const localUser = normalizeUser(getUser());
      try {
        const profilePayload = await fetchFirst(['/profile', '/me', '/user']);
        if (!ignore && profilePayload) {
          const nextProfile = normalizeUser(profilePayload, localUser);
          setProfile(nextProfile);
          setForm(profileForm(nextProfile));
          if (nextProfile?.id || nextProfile?.email) {
            setSession({ user: nextProfile });
          }
        }
      } catch {
        if (!ignore) {
          setProfile(localUser);
          setForm(profileForm(localUser));
        }
      }

      try {
        const current = normalizeUser(getUser()) || localUser;
        const role = getPrimaryRole(current);
        const summaryPath = roleSummaryPath(role);
        if (summaryPath) {
          const res = await apiRequest(summaryPath);
          if (!ignore) setSummary(res?.data || res);
        }
      } catch {
        if (!ignore) setSummary(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    const next = searchParams.get('tab') || 'overview';
    setTab(next);
  }, [searchParams]);

  function selectTab(next) {
    setSuccess('');
    setError('');
    setSearchParams(next === 'overview' ? {} : { tab: next });
  }

  async function submitProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const hasFile = form.photo instanceof File;
      const body = hasFile ? new FormData() : JSON.stringify(serializedProfileForm(form));

      if (hasFile) {
        Object.entries(serializedProfileForm(form)).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') body.append(key, value);
        });
        body.append('photo', form.photo);
      }

      const res = await apiRequest('/profile', {
        method: 'POST',
        body,
      });

      const nextProfile = normalizeUser(res, profile);
      setProfile(nextProfile);
      setForm(profileForm(nextProfile));
      setSession({ user: nextProfile });
      setSuccess(dt('profileUpdated'));
    } catch (e) {
      setError(e.message || dt('profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  }

  return <section className="public-profile-page" dir={dir}>
    <div className="public-container">
      <div className="public-profile-toolbar">
        <Link className="button-link secondary-link" to="/catalog">
          <BookOpenText size={17} /> {dt('browseBooks')}
        </Link>
        {hasDashboard && <Link className="button-link" to={defaultRouteFor(profile)}>
          <Gauge size={17} /> {dt('goToRolePortal')}
        </Link>}
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="noor-user-profile-card">
        <div className="member-top-border" />
        <div className="profile-cover-soft">
          <span><Sparkles size={18} /> {roleInfo.badge}</span>
        </div>

        <div className="user-profile-hero">
          <div className="member-avatar-large profile-avatar-xl">
            {photo ? <img src={photo} alt={displayName(profile)} /> : <UserRound size={80} />}
          </div>
          <h1>{displayName(profile)}</h1>
          <p className="member-role">{roleInfo.subtitle}</p>

          <div className="profile-main-actions">
            <button type="button" className="profile-message-btn profile-edit-btn" onClick={() => selectTab('settings')}>
              <Edit3 size={17} /> {dt('editProfile')}
            </button>
            <Link className="profile-message-btn" to="/catalog">
              <MessageCircle size={17} /> {dt('browseNewBook')}
            </Link>
          </div>
        </div>

        <div className="member-fact-grid profile-fact-grid-wide">
          {facts.map((item) => <ProfileFact key={item.key} icon={item.icon} label={item.label} value={item.value} />)}
        </div>

        <div className="member-library-stats profile-role-stats">
          {metrics.slice(0, 4).map((item) => <span key={item.key}>{item.icon}<b>{loading ? '...' : item.value}</b><small>{item.label}</small></span>)}
        </div>
      </div>

      <div className="profile-tabs-card">
        <div className="profile-tabs">
          <button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => selectTab('overview')}>{dt('profileOverview')}</button>
          <button type="button" className={tab === 'activity' ? 'active' : ''} onClick={() => selectTab('activity')}>{dt('profileActivity')}</button>
          <button type="button" className={tab === 'settings' ? 'active' : ''} onClick={() => selectTab('settings')}>{dt('profileSettings')}</button>
        </div>

        {tab === 'overview' && <ProfileOverview profile={profile} roleInfo={roleInfo} metrics={metrics} actions={actions} dt={dt} />}
        {tab === 'activity' && <ProfileActivity primaryRole={primaryRole} summary={summary} actions={actions} dt={dt} />}
        {tab === 'settings' && <ProfileSettings form={form} setForm={setForm} onSubmit={submitProfile} saving={saving} dt={dt} />}
      </div>
    </div>
  </section>;
}

function ProfileOverview({ profile, roleInfo, metrics, actions, dt }) {
  return <div className="profile-overview-grid">
    <div className="profile-info-panel">
      <h2>{dt('profileBio')}</h2>
      <p>{profile?.bio || profile?.about || dt('noProfileBio')}</p>
      <div className="profile-detail-list">
        <span><Mail size={18} /> <b>{dt('email')}:</b> {profile?.email || '-'}</span>
        <span><ShieldCheck size={18} /> <b>{dt('role')}:</b> {roleInfo.subtitle}</span>
        <span><CalendarDays size={18} /> <b>{dt('joinedAt')}:</b> {profile?.created_at || profile?.joined_at || '-'}</span>
      </div>
    </div>

    <div className="profile-info-panel">
      <h2>{dt('quickActions')}</h2>
      <div className="profile-action-grid">
        {actions.map((action) => <Link key={action.to + action.label} to={action.to}>{action.icon}<span>{action.label}</span></Link>)}
      </div>
    </div>

    <div className="profile-info-panel full-panel">
      <h2>{dt('accountSummary')}</h2>
      <div className="profile-mini-metrics">
        {metrics.map((item) => <div key={item.key}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </div>
    </div>
  </div>;
}

function ProfileActivity({ primaryRole, summary, actions, dt }) {
  return <div className="profile-activity-panel">
    <h2>{activityTitle(primaryRole, dt)}</h2>
    <p>{activityText(primaryRole, dt)}</p>
    <div className="profile-action-row">
      {actions.map((action) => <Link key={action.to + action.label} className="button-link secondary-link" to={action.to}>{action.icon} {action.label}</Link>)}
    </div>
    <div className="member-empty-books profile-empty-state">
      <FolderOpen size={58} />
      <p>{summary ? dt('profileActivityReady') : dt('profileActivityFallback')}</p>
    </div>
  </div>;
}

function ProfileSettings({ form, setForm, onSubmit, saving, dt }) {
  const preview = imagePreview(form.photo) || personImageUrl(form);

  return <form className="profile-settings-form" onSubmit={onSubmit}>
    <div className="profile-settings-head">
      <div className="member-avatar-large settings-avatar">
        {preview ? <img src={preview} alt={form.name || 'profile'} /> : <UserRound size={54} />}
      </div>
      <div>
        <h2>{dt('profileSettings')}</h2>
        <p>{dt('profileSettingsHint')}</p>
      </div>
    </div>

    <div className="form-grid profile-form-grid">
      <label>
        {dt('name')}
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </label>
      <label>
        {dt('email')}
        <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>
        {dt('phone')}
        <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </label>
      <label>
        {dt('country')}
        <input value={form.country || ''} onChange={(e) => setForm({ ...form, country: e.target.value })} />
      </label>
      <label className="full">
        {dt('photo')}
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || form.photo })} />
      </label>
      <label className="full">
        {dt('bio')}
        <textarea rows="4" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </label>
    </div>

    <div className="form-actions">
      <button type="submit" disabled={saving}><Save size={17} /> {saving ? dt('saving') : dt('save')}</button>
    </div>
  </form>;
}

function ProfileFact({ icon: Icon, label, value }) {
  return <div className="profile-fact">
    <Icon size={25} />
    <span>{label}</span>
    <b>{value || '-'}</b>
  </div>;
}

async function fetchFirst(paths) {
  for (const path of paths) {
    try {
      const res = await apiRequest(path);
      return res?.data?.user || res?.user || res?.data || res;
    } catch {}
  }
  return null;
}

function normalizeUser(payload, fallback = null) {
  const item = payload?.data?.user || payload?.user || payload?.data || payload || fallback;
  if (!item || typeof item !== 'object') return fallback;
  return {
    ...fallback,
    ...item,
    roles: item.roles || fallback?.roles || [],
    permissions: item.permissions || fallback?.permissions || [],
  };
}

function profileForm(user) {
  return {
    name: user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || user?.nationality || '',
    bio: user?.bio || user?.about || '',
    photo: user?.photo_url || user?.avatar_url || user?.profile_photo_url || user?.photo || user?.avatar || '',
  };
}

function serializedProfileForm(form) {
  return {
    name: form.name,
    email: form.email,
    phone: form.phone,
    country: form.country,
    bio: form.bio,
  };
}

function imagePreview(value) {
  if (value instanceof File) return URL.createObjectURL(value);
  return '';
}

function displayName(user) {
  if (!user) return '-';
  return user.name || [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ') || user.email || '-';
}

function getPrimaryRole(user) {
  const roles = user?.roles || [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('librarian')) return 'librarian';
  if (roles.includes('publisher')) return 'publisher';
  if (roles.includes('member')) return 'member';
  return 'user';
}

function rolePresentation(role, dt) {
  const map = {
    admin: { subtitle: dt('adminRole'), badge: dt('adminProfileBadge') },
    librarian: { subtitle: dt('librarianRole'), badge: dt('librarianProfileBadge') },
    publisher: { subtitle: dt('publisherRole'), badge: dt('publisherProfileBadge') },
    member: { subtitle: dt('memberReaderRole'), badge: dt('memberProfileBadge') },
    user: { subtitle: dt('userRole'), badge: dt('userProfileBadge') },
  };
  return map[role] || map.user;
}

function profileFacts(user, role, dt) {
  const base = [
    { key: 'country', icon: MapPin, label: dt('country'), value: user?.country || user?.nationality || 'Palestine' },
    { key: 'lastSeen', icon: CalendarDays, label: dt('lastSeen'), value: dt('onlineNow') },
    { key: 'rating', icon: Star, label: dt('rating'), value: role === 'admin' ? dt('trustedAdmin') : '0 / 5' },
    { key: 'membership', icon: role === 'admin' ? Crown : CreditCard, label: role === 'admin' ? dt('systemAccess') : dt('membershipNumber'), value: user?.membership_number || user?.id || '-' },
  ];
  if (role === 'publisher') base[3] = { key: 'publisher', icon: UploadCloud, label: dt('publisherPortal'), value: dt('activeAccount') };
  if (role === 'librarian') base[3] = { key: 'librarian', icon: LibraryBig, label: dt('librarianDashboard'), value: dt('activeAccount') };
  return base;
}

function roleSummaryPath(role) {
  if (role === 'admin' || role === 'librarian') return '/reports/summary';
  if (role === 'publisher') return '/publisher/dashboard';
  if (role === 'member') return null;
  return null;
}

function roleMetrics(summary, user, role, dt) {
  if (role === 'admin' || role === 'librarian') {
    return [
      { key: 'books', label: dt('totalBooks'), value: pick(summary, ['books_count', 'total_books'], 0), icon: <BookOpenText size={24} /> },
      { key: 'members', label: dt('totalMembers'), value: pick(summary, ['members_count', 'total_members'], 0), icon: <UsersRound size={24} /> },
      { key: 'borrowings', label: dt('activeBorrowings'), value: pick(summary, ['active_borrowings', 'borrowed_books'], 0), icon: <LibraryBig size={24} /> },
      { key: 'reservations', label: dt('pendingReservations'), value: pick(summary, ['pending_reservations'], 0), icon: <Bell size={24} /> },
      { key: 'permissions', label: dt('permissions'), value: user?.permissions?.length || 0, icon: <KeyRound size={24} /> },
    ];
  }

  if (role === 'publisher') {
    return [
      { key: 'books', label: dt('myBooksCount'), value: pick(summary, ['books_count', 'total_books', 'my_books_count'], 0), icon: <BookOpenText size={24} /> },
      { key: 'pending', label: dt('pendingReview'), value: pick(summary, ['pending_books_count', 'pending_review_count', 'pending_books'], 0), icon: <Bell size={24} /> },
      { key: 'approved', label: dt('approvedBooks'), value: pick(summary, ['approved_books_count', 'approved_books'], 0), icon: <CheckCircle2 size={24} /> },
      { key: 'available', label: dt('availableCopies'), value: pick(summary, ['available_copies'], 0), icon: <LibraryBig size={24} /> },
    ];
  }

  return [
    { key: 'borrowed', label: dt('borrowedCount'), value: pick(summary, ['borrowed_count', 'borrowings_count', 'active_borrowings_count'], 0), icon: <LibraryBig size={24} /> },
    { key: 'returned', label: dt('returnedCount'), value: pick(summary, ['returned_count', 'returned_borrowings_count'], 0), icon: <LibraryBig size={24} /> },
    { key: 'overdue', label: dt('overdueCount'), value: pick(summary, ['overdue_count', 'overdue_borrowings_count'], 0), icon: <Bell size={24} /> },
    { key: 'fines', label: dt('unpaidFinesCount'), value: pick(summary, ['unpaid_fines_count'], 0), icon: <CreditCard size={24} /> },
  ];
}

function roleActions(role, dt) {
  if (role === 'admin') {
    return [
      { to: '/admin', label: dt('adminDashboard'), icon: <Gauge size={17} /> },
      { to: '/admin/books', label: dt('books'), icon: <BookOpenText size={17} /> },
      { to: '/admin/members', label: dt('members'), icon: <UsersRound size={17} /> },
      { to: '/admin/reports', label: dt('reports'), icon: <Award size={17} /> },
      { to: '/admin/messages', label: dt('messages'), icon: <MessageCircle size={17} /> },
    ];
  }
  if (role === 'librarian') {
    return [
      { to: '/librarian', label: dt('librarianDashboard'), icon: <Gauge size={17} /> },
      { to: '/librarian/borrowings', label: dt('borrowings'), icon: <LibraryBig size={17} /> },
      { to: '/librarian/reservations', label: dt('reservations'), icon: <Bell size={17} /> },
      { to: '/librarian/books', label: dt('books'), icon: <BookOpenText size={17} /> },
      { to: '/librarian/messages', label: dt('messages'), icon: <MessageCircle size={17} /> },
    ];
  }
  if (role === 'publisher') {
    return [
      { to: '/publisher', label: dt('publisherPortal'), icon: <BriefcaseBusiness size={17} /> },
      { to: '/publisher?tab=books', label: dt('myBooks'), icon: <FolderOpen size={17} /> },
      { to: '/publisher-services', label: dt('publisherServices'), icon: <Globe2 size={17} /> },
      { to: '/catalog', label: dt('catalog'), icon: <BookOpenText size={17} /> },
      { to: '/messages', label: dt('messages'), icon: <MessageCircle size={17} /> },
    ];
  }
  return [
    { to: '/catalog', label: dt('browseBooks'), icon: <BookOpenText size={17} /> },
    { to: '/my?tab=borrowings', label: dt('myBorrowings'), icon: <UserRound size={17} /> },
    { to: '/my?tab=reservations', label: dt('myReservations'), icon: <Bell size={17} /> },
    { to: '/messages', label: dt('messages'), icon: <MessageCircle size={17} /> },
    { to: '/publisher-services', label: dt('publisherAccountRequest'), icon: <UploadCloud size={17} /> },
  ];
}

function activityTitle(role, dt) {
  if (role === 'admin') return dt('adminActivityTitle');
  if (role === 'librarian') return dt('librarianActivityTitle');
  if (role === 'publisher') return dt('publisherActivityTitle');
  return dt('memberActivityTitle');
}

function activityText(role, dt) {
  if (role === 'admin') return dt('adminActivityText');
  if (role === 'librarian') return dt('librarianActivityText');
  if (role === 'publisher') return dt('publisherActivityText');
  return dt('memberActivityText');
}

function pick(obj, keys, defaultValue = 0) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return defaultValue;
}
