import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { fetchNotifications, formatDateTime, markAllNotificationsRead, markNotificationRead } from '../utils/communication.js';

const labels = {
  ar: {
    notifications: 'الإشعارات',
    messages: 'الرسائل',
    noNotifications: 'لا توجد إشعارات جديدة الآن.',
    markAll: 'تعيين الكل كمقروء',
    viewAll: 'عرض كل الإشعارات',
    openMessages: 'فتح الرسائل',
  },
  en: {
    notifications: 'Notifications',
    messages: 'Messages',
    noNotifications: 'No new notifications right now.',
    markAll: 'Mark all as read',
    viewAll: 'View all notifications',
    openMessages: 'Open messages',
  },
};

export default function NotificationDropdown({ className = 'quick-search nav-icon-button' }) {
  const { language } = useLanguage();
  const text = labels[language] || labels.ar;
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);

  const unread = useMemo(() => rows.filter((item) => !item.read_at).length, [rows]);

  async function load() {
    const next = await fetchNotifications({ limit: 8 });
    setRows(next);
  }

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('library-notifications-updated', handler);
    return () => window.removeEventListener('library-notifications-updated', handler);
  }, []);

  async function readItem(item) {
    if (!item.read_at) {
      const next = await markNotificationRead(item.id);
      setRows(next.slice(0, 8));
    }
  }

  async function readAll() {
    const next = await markAllNotificationsRead();
    setRows(next.slice(0, 8));
  }

  return <div className="notification-dropdown-wrap" onMouseLeave={() => setOpen(false)}>
    <button type="button" className={className} title={text.notifications} onClick={() => setOpen((value) => !value)}>
      <Bell size={18} />
      {unread > 0 && <span className="nav-counter">{unread > 9 ? '9+' : unread}</span>}
    </button>

    {open && <div className="notification-menu-card">
      <div className="notification-menu-head">
        <strong>{text.notifications}</strong>
        {unread > 0 && <button type="button" onClick={readAll}><CheckCheck size={15} /> {text.markAll}</button>}
      </div>

      <div className="notification-list-mini">
        {rows.length === 0 && <p className="empty-mini-note">{text.noNotifications}</p>}
        {rows.map((item) => {
          const content = <>
            <span className="mini-notification-icon">{item.type === 'message' ? <MessageCircle size={16} /> : <Bell size={16} />}</span>
            <span>
              <b>{item.title}</b>
              <small>{item.body}</small>
              <em>{formatDateTime(item.created_at, language)}</em>
            </span>
          </>;

          return item.url ? (
            <Link key={item.id} to={item.url} className={!item.read_at ? 'unread' : ''} onClick={() => readItem(item)}>
              {content}
            </Link>
          ) : (
            <button key={item.id} type="button" className={!item.read_at ? 'unread' : ''} onClick={() => readItem(item)}>
              {content}
            </button>
          );
        })}
      </div>

      <div className="notification-menu-footer">
        <Link to="/notifications">{text.viewAll}</Link>
        <Link to="/messages">{text.openMessages}</Link>
      </div>
    </div>}
  </div>;
}
