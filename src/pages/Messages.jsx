import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, LibraryBig, MessageCircle, Paperclip, Send, UserRound, UsersRound } from 'lucide-react';
import Alert from '../components/Alert.jsx';
import { getUser } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import {
  displayName,
  fetchConversationMessages,
  fetchConversations,
  formatDateTime,
  getPrimaryRole,
  isStaffUser,
  markConversationRead,
  sendConversationMessage,
  startSupportConversation,
  userKey,
} from '../utils/communication.js';

const labels = {
  ar: {
    title: 'الرسائل',
    subtitleMember: 'تواصل مباشر بينك وبين أمين المكتبة للاستفسار عن الكتب، الإعارات، الحجوزات، والغرامات.',
    subtitleStaff: 'استقبال رسائل الأعضاء والرد عليها من شاشة واحدة مرتبة.',
    librarian: 'أمين المكتبة',
    member: 'عضو مكتبة',
    conversations: 'المحادثات',
    startSupport: 'مراسلة أمين المكتبة',
    newConversation: 'فتح محادثة دعم',
    noConversations: 'لا توجد محادثات حتى الآن.',
    selectConversation: 'اختر محادثة من القائمة للرد عليها.',
    typeMessage: 'اكتب رسالتك هنا...',
    send: 'إرسال',
    sending: 'جارٍ الإرسال...',
    attach: 'مرفق',
    emptyThread: 'لا توجد رسائل داخل هذه المحادثة.',
    subject: 'محادثة دعم مكتبي',
    online: 'متاح للرد',
    offlineNotice: 'تعمل الصفحة الآن مع LocalStorage عند غياب مسارات Laravel، وستتصل تلقائيًا بالـ API عند تفعيل المسارات.',
    staffBadge: 'قسم خدمة الأعضاء',
    memberBadge: 'محادثة مع أمين المكتبة',
  },
  en: {
    title: 'Messages',
    subtitleMember: 'Direct communication with the librarian for books, borrowing, reservations, and fines.',
    subtitleStaff: 'Receive and reply to member messages from one organized screen.',
    librarian: 'Librarian',
    member: 'Library Member',
    conversations: 'Conversations',
    startSupport: 'Message the Librarian',
    newConversation: 'Start Support Chat',
    noConversations: 'No conversations yet.',
    selectConversation: 'Select a conversation to reply.',
    typeMessage: 'Type your message here...',
    send: 'Send',
    sending: 'Sending...',
    attach: 'Attachment',
    emptyThread: 'There are no messages in this conversation.',
    subject: 'Library Support Chat',
    online: 'Available to reply',
    offlineNotice: 'This page uses LocalStorage when Laravel routes are missing and connects automatically when API routes are enabled.',
    staffBadge: 'Member Service Desk',
    memberBadge: 'Conversation with Librarian',
  },
};

export default function Messages() {
  const { language, dir } = useLanguage();
  const text = labels[language] || labels.ar;
  const currentUser = getUser();
  const role = getPrimaryRole(currentUser);
  const staff = isStaffUser(currentUser);
  const currentUserId = userKey(currentUser);
  const bottomRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const activeConversation = useMemo(() => conversations.find((item) => String(item.id) === String(activeId)), [conversations, activeId]);

  async function loadConversations(selectFirst = true) {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchConversations();
      setConversations(rows);

      if (selectFirst) {
        const nextId = activeId || rows[0]?.id || '';
        if (nextId) {
          setActiveId(nextId);
          await loadMessages(nextId);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId) {
    if (!conversationId) return;
    setThreadLoading(true);
    setError('');
    try {
      const rows = await fetchConversationMessages(conversationId);
      setMessages(rows);
      await markConversationRead(conversationId);
      window.dispatchEvent(new CustomEvent('library-messages-updated'));
    } catch (e) {
      setError(e.message);
    } finally {
      setThreadLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  useEffect(() => {
    loadConversations(true);
  }, []);

  useEffect(() => {
    const handler = () => loadConversations(false);
    window.addEventListener('library-messages-updated', handler);
    return () => window.removeEventListener('library-messages-updated', handler);
  }, [activeId]);

  async function startChat() {
    setError('');
    const conversation = await startSupportConversation(text.subject);
    await loadConversations(false);
    setActiveId(conversation.id);
    await loadMessages(conversation.id);
  }

  async function selectConversation(id) {
    setActiveId(id);
    await loadMessages(id);
  }

  async function submit(e) {
    e.preventDefault();
    if (!activeId) return;
    if (!messageText.trim() && !attachment) return;

    setSending(true);
    setError('');
    try {
      const sent = await sendConversationMessage(activeId, messageText, attachment);
      setMessageText('');
      setAttachment(null);
      if (sent) setMessages((current) => [...current, sent]);
      await loadConversations(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return <section className="communication-page" dir={dir}>
    <div className="public-container">
      <div className="communication-hero message-hero">
        <span>{staff ? <UsersRound size={18} /> : <LibraryBig size={18} />} {staff ? text.staffBadge : text.memberBadge}</span>
        <h1>{text.title}</h1>
        <p>{staff ? text.subtitleStaff : text.subtitleMember}</p>
        <div className="communication-actions-row">
          <button type="button" onClick={startChat}><MessageCircle size={17} /> {staff ? text.newConversation : text.startSupport}</button>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <p className="system-note-soft">{text.offlineNotice}</p>

      <div className="messages-shell-card">
        <aside className="conversation-sidebar">
          <div className="conversation-sidebar-head">
            <h2>{text.conversations}</h2>
            <button type="button" onClick={startChat}>+</button>
          </div>

          {loading && <div className="conversation-empty">...</div>}
          {!loading && conversations.length === 0 && <div className="conversation-empty">{text.noConversations}</div>}

          <div className="conversation-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={String(activeId) === String(conversation.id) ? 'active' : ''}
                onClick={() => selectConversation(conversation.id)}
              >
                <span className="conversation-avatar"><UserRound size={20} /></span>
                <span className="conversation-text">
                  <b>{conversation.participant_name || (staff ? text.member : text.librarian)}</b>
                  <small>{conversation.last_message || conversation.subject}</small>
                </span>
                {conversationUnreadCount(conversation, currentUserId) > 0 && <em>{conversationUnreadCount(conversation, currentUserId)}</em>}
              </button>
            ))}
          </div>
        </aside>

        <main className="chat-panel">
          {activeConversation ? <>
            <div className="chat-head">
              <span className="chat-avatar"><UserRound size={30} /></span>
              <div>
                <h2>{activeConversation.participant_name || (staff ? text.member : text.librarian)}</h2>
                <p><Bell size={14} /> {text.online}</p>
              </div>
            </div>

            <div className="chat-thread">
              {threadLoading && <div className="communication-empty">...</div>}
              {!threadLoading && messages.length === 0 && <div className="communication-empty">{text.emptyThread}</div>}
              {!threadLoading && messages.map((message) => {
                const mine = String(message.sender_user_id) === String(currentUserId) || message.sender_name === displayName(currentUser);
                return <article key={message.id} className={`chat-message ${mine ? 'mine' : 'theirs'}`}>
                  <div>
                    <strong>{mine ? displayName(currentUser) : message.sender_name}</strong>
                    <p>{message.body}</p>
                    {message.attachment_url && <a href={message.attachment_url} target="_blank" rel="noreferrer">{text.attach}</a>}
                    <small>{formatDateTime(message.created_at, language)}</small>
                  </div>
                </article>;
              })}
              <div ref={bottomRef} />
            </div>

            <form className="chat-compose" onSubmit={submit}>
              <label className="chat-attach-button">
                <Paperclip size={18} />
                <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              </label>
              <textarea
                rows="2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={text.typeMessage}
              />
              <button type="submit" disabled={sending || (!messageText.trim() && !attachment)}>
                <Send size={18} /> {sending ? text.sending : text.send}
              </button>
            </form>
          </> : <div className="chat-no-selection">
            <MessageCircle size={48} />
            <p>{text.selectConversation}</p>
            <button type="button" onClick={startChat}>{staff ? text.newConversation : text.startSupport}</button>
          </div>}
        </main>
      </div>
    </div>
  </section>;
}

function conversationUnreadCount(conversation, currentUserId) {
  return (conversation.messages || []).filter((message) => (
    String(message.sender_user_id) !== String(currentUserId) && !(message.read_by || []).includes(currentUserId)
  )).length;
}
