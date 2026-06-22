import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { countUnreadMessages, fetchConversations } from '../utils/communication.js';

export default function MessageShortcut({ className = 'quick-search nav-icon-button' }) {
  const { t } = useLanguage();
  const [unread, setUnread] = useState(0);

  async function refresh() {
    try {
      await fetchConversations();
    } catch {}
    setUnread(countUnreadMessages());
  }

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('library-messages-updated', handler);
    return () => window.removeEventListener('library-messages-updated', handler);
  }, []);

  return <Link className={className} to="/messages" title={t('messages')}>
    <MessageCircle size={18} />
    {unread > 0 && <span className="nav-counter">{unread > 9 ? '9+' : unread}</span>}
  </Link>;
}
