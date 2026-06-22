import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, MessageCircle } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fetchNotifications, formatDateTime, markAllNotificationsRead, markNotificationRead } from '../utils/communication.js';

const labels = {
  ar: {
    title: 'مركز الإشعارات',
    text: 'تابع إشعارات الاستعارات، الحجوزات، الغرامات، طلبات الناشرين، والرسائل الجديدة من مكان واحد.',
    markAll: 'تعيين كل الإشعارات كمقروءة',
    all: 'كل الإشعارات',
    unread: 'غير المقروءة',
    read: 'المقروءة',
    empty: 'لا توجد إشعارات في هذا القسم حاليًا.',
    open: 'فتح',
    messages: 'الانتقال إلى الرسائل',
    loadedOffline: 'إذا لم تكن مسارات Laravel مفعلة، يتم عرض إشعارات محلية تجريبية حتى يتم ربط الباك إند.',
  },
  en: {
    title: 'Notifications Center',
    text: 'Track borrowing, reservations, fines, publisher requests, and new messages in one place.',
    markAll: 'Mark all notifications as read',
    all: 'All notifications',
    unread: 'Unread',
    read: 'Read',
    empty: 'No notifications in this section right now.',
    open: 'Open',
    messages: 'Go to messages',
    loadedOffline: 'If Laravel routes are not active yet, local demo notifications are shown until backend wiring is added.',
  },
};

export default function Notifications() {
  const { language, dir } = useLanguage();
  const text = labels[language] || labels.ar;
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredRows = useMemo(() => {
    if (filter === 'unread') return rows.filter((item) => !item.read_at);
    if (filter === 'read') return rows.filter((item) => item.read_at);
    return rows;
  }, [rows, filter]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const next = await fetchNotifications({ limit: 40 });
      setRows(next);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function readItem(id) {
    const next = await markNotificationRead(id);
    setRows(next);
    window.dispatchEvent(new CustomEvent('library-notifications-updated'));
  }

  async function readAll() {
    const next = await markAllNotificationsRead();
    setRows(next);
    window.dispatchEvent(new CustomEvent('library-notifications-updated'));
  }

  return <section className="communication-page" dir={dir}>
    <div className="public-container">
      <div className="communication-hero">
        <span><Bell size={18} /> {text.title}</span>
        <h1>{text.title}</h1>
        <p>{text.text}</p>
        <div className="communication-actions-row">
          <button type="button" onClick={readAll}><CheckCheck size={17} /> {text.markAll}</button>
          <Link to="/messages"><MessageCircle size={17} /> {text.messages}</Link>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <p className="system-note-soft">{text.loadedOffline}</p>

      <div className="communication-tabs">
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>{text.all}</button>
        <button type="button" className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>{text.unread}</button>
        <button type="button" className={filter === 'read' ? 'active' : ''} onClick={() => setFilter('read')}>{text.read}</button>
      </div>

      <div className="notifications-page-list">
        {loading && <div className="communication-empty">...</div>}
        {!loading && filteredRows.length === 0 && <div className="communication-empty">{text.empty}</div>}
        {!loading && filteredRows.map((item) => (
          <article key={item.id} className={`notification-page-card ${!item.read_at ? 'unread' : ''}`}>
            <span className="notification-page-icon">{item.type === 'message' ? <MessageCircle size={22} /> : <Bell size={22} />}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <small>{formatDateTime(item.created_at, language)}</small>
            </div>
            <div className="notification-card-actions">
              {!item.read_at && <button type="button" onClick={() => readItem(item.id)}><CheckCheck size={16} /> {text.read}</button>}
              {item.url && <Link to={item.url}><ExternalLink size={16} /> {text.open}</Link>}
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>;
}
