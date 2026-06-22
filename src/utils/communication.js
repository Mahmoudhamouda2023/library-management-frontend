import { apiRequest, getList, getUser } from '../api/client.js';

const CONVERSATIONS_KEY = 'library_conversations_v1';
const NOTIFICATION_PREFIX = 'library_notifications_v1_';

export function userKey(user = getUser()) {
  return String(user?.id || user?.email || user?.name || 'guest').replace(/[^a-zA-Z0-9_.@-]/g, '_');
}

export function displayName(user) {
  return user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User';
}

export function getPrimaryRole(user = getUser()) {
  const roles = user?.roles || [];
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('librarian')) return 'librarian';
  if (roles.includes('publisher')) return 'publisher';
  if (roles.includes('member')) return 'member';
  return 'user';
}

export function isStaffUser(user = getUser()) {
  const role = getPrimaryRole(user);
  return role === 'admin' || role === 'librarian';
}

export function normalizeDate(value = null) {
  try {
    return value ? new Date(value).toISOString() : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function formatDateTime(value, language = 'ar') {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function normalizeNotification(item) {
  const raw = item?.data && typeof item.data === 'object' ? { ...item.data, ...item } : item;
  return {
    id: String(raw?.id || raw?.notification_id || raw?.uuid || Date.now()),
    title: raw?.title || raw?.subject || raw?.type || 'Notification',
    body: raw?.body || raw?.message || raw?.text || raw?.description || '',
    read_at: raw?.read_at || raw?.readAt || null,
    created_at: raw?.created_at || raw?.createdAt || raw?.date || normalizeDate(),
    url: raw?.url || raw?.link || raw?.action_url || '',
    type: raw?.type || 'general',
  };
}

export async function fetchNotifications({ limit = 10 } = {}) {
  try {
    const payload = await apiRequest(`/notifications?limit=${limit}`);
    const rows = getList(payload).map(normalizeNotification);
    if (rows.length) return rows;
  } catch {}

  return getLocalNotifications().slice(0, limit);
}

export async function markNotificationRead(id) {
  try {
    await apiRequest(`/notifications/${id}/read`, { method: 'POST' });
  } catch {}

  const rows = getLocalNotifications().map((item) => (
    String(item.id) === String(id) ? { ...item, read_at: normalizeDate() } : item
  ));
  saveLocalNotifications(rows);
  return rows;
}

export async function markAllNotificationsRead() {
  try {
    await apiRequest('/notifications/read-all', { method: 'POST' });
  } catch {}

  const rows = getLocalNotifications().map((item) => ({ ...item, read_at: item.read_at || normalizeDate() }));
  saveLocalNotifications(rows);
  return rows;
}

export function getLocalNotifications(user = getUser()) {
  const key = `${NOTIFICATION_PREFIX}${userKey(user)}`;
  try {
    const rows = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(rows) && rows.length) return rows.map(normalizeNotification);
  } catch {}

  const seeded = seedNotifications(user);
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export function saveLocalNotifications(rows, user = getUser()) {
  const key = `${NOTIFICATION_PREFIX}${userKey(user)}`;
  localStorage.setItem(key, JSON.stringify(rows.map(normalizeNotification)));
}

export function pushLocalNotification(notification, user = getUser()) {
  const rows = getLocalNotifications(user);
  const next = [normalizeNotification({ id: `local-${Date.now()}`, ...notification }), ...rows].slice(0, 40);
  saveLocalNotifications(next, user);
  window.dispatchEvent(new CustomEvent('library-notifications-updated'));
  return next;
}

function seedNotifications(user = getUser()) {
  const role = getPrimaryRole(user);
  const now = normalizeDate();
  const common = [
    {
      id: 'welcome-notification',
      title: role === 'admin' || role === 'librarian' ? 'لوحة الإشعارات جاهزة' : 'تم تفعيل إشعارات حسابك',
      body: role === 'admin' || role === 'librarian'
        ? 'ستظهر هنا طلبات الأعضاء والحجوزات والرسائل الجديدة.'
        : 'ستصلك هنا حالة الحجز والاستعارة وردود أمين المكتبة على رسائلك.',
      read_at: null,
      created_at: now,
      url: '/notifications',
      type: 'system',
    },
    {
      id: 'messages-enabled',
      title: 'تم تفعيل الرسائل',
      body: role === 'admin' || role === 'librarian'
        ? 'يمكنك الآن الرد على رسائل الأعضاء من صفحة الرسائل.'
        : 'يمكنك الآن مراسلة أمين المكتبة مباشرة من الموقع.',
      read_at: null,
      created_at: now,
      url: '/messages',
      type: 'message',
    },
  ];
  return common;
}

export async function fetchConversations() {
  try {
    const payload = await apiRequest('/conversations');
    const rows = getList(payload).map(normalizeConversation);
    if (rows.length) return rows;
  } catch {}

  try {
    const payload = await apiRequest('/messages/conversations');
    const rows = getList(payload).map(normalizeConversation);
    if (rows.length) return rows;
  } catch {}

  return getLocalConversationsForUser();
}

export async function fetchConversationMessages(conversationId) {
  try {
    const payload = await apiRequest(`/conversations/${conversationId}/messages`);
    const rows = getList(payload).map((item) => normalizeMessage(item, conversationId));
    if (rows.length) return rows;
  } catch {}

  const conversation = getLocalConversation(conversationId);
  return (conversation?.messages || []).map((item) => normalizeMessage(item, conversationId));
}

export async function sendConversationMessage(conversationId, body, attachment = null) {
  const text = String(body || '').trim();
  if (!text && !attachment) return null;

  try {
    const formData = attachment instanceof File ? new FormData() : null;
    let payloadBody = JSON.stringify({ body: text, message: text });

    if (formData) {
      formData.append('body', text);
      formData.append('message', text);
      formData.append('attachment', attachment);
      payloadBody = formData;
    }

    const payload = await apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: payloadBody,
    });
    return normalizeMessage(payload?.data || payload, conversationId);
  } catch {}

  const user = getUser();
  const message = normalizeMessage({
    id: `msg-${Date.now()}`,
    conversation_id: conversationId,
    body: text,
    sender_user_id: userKey(user),
    sender_name: displayName(user),
    sender_role: getPrimaryRole(user),
    created_at: normalizeDate(),
    read_by: [userKey(user)],
  }, conversationId);

  const conversation = ensureLocalConversation(conversationId);
  conversation.messages = [...(conversation.messages || []), message];
  conversation.last_message = text;
  conversation.updated_at = message.created_at;
  saveLocalConversation(conversation);

  const targetUser = isStaffUser(user) ? null : user;
  pushLocalNotification({
    title: 'رسالة جديدة',
    body: isStaffUser(user) ? 'تم إرسال رد للعضو بنجاح.' : 'تم إرسال رسالتك إلى أمين المكتبة.',
    url: '/messages',
    type: 'message',
  }, targetUser || user);

  return message;
}

export async function markConversationRead(conversationId) {
  try {
    await apiRequest(`/conversations/${conversationId}/read`, { method: 'POST' });
  } catch {}

  const current = userKey(getUser());
  const conversation = getLocalConversation(conversationId);
  if (!conversation) return;
  conversation.messages = (conversation.messages || []).map((message) => ({
    ...message,
    read_by: Array.from(new Set([...(message.read_by || []), current])),
  }));
  saveLocalConversation(conversation);
  window.dispatchEvent(new CustomEvent('library-messages-updated'));
}

export async function startSupportConversation(subject = '') {
  try {
    const payload = await apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({ recipient_role: 'librarian', subject }),
    });
    return normalizeConversation(payload?.data || payload);
  } catch {}

  const user = getUser();
  return ensureLocalConversation(`support-${userKey(user)}`);
}

export function countUnreadMessages() {
  const current = userKey(getUser());
  const rows = getLocalConversationsForUser();
  return rows.reduce((sum, conversation) => sum + (conversation.messages || []).filter((message) => (
    String(message.sender_user_id) !== current && !(message.read_by || []).includes(current)
  )).length, 0);
}

export function normalizeConversation(item) {
  const user = getUser();
  const id = String(item?.id || item?.conversation_id || item?.uuid || `support-${userKey(user)}`);
  const messages = Array.isArray(item?.messages) ? item.messages.map((message) => normalizeMessage(message, id)) : [];
  const last = messages[messages.length - 1];
  return {
    id,
    subject: item?.subject || item?.title || 'محادثة مع أمين المكتبة',
    member: item?.member || item?.user || item?.reader || null,
    librarian: item?.librarian || null,
    participant_name: item?.participant_name || item?.name || displayParticipantName(item, user),
    status: item?.status || 'open',
    updated_at: item?.updated_at || last?.created_at || item?.created_at || normalizeDate(),
    last_message: item?.last_message || last?.body || item?.snippet || '',
    messages,
  };
}

export function normalizeMessage(item, conversationId) {
  return {
    id: String(item?.id || item?.message_id || `msg-${Date.now()}`),
    conversation_id: String(item?.conversation_id || conversationId),
    body: item?.body || item?.message || item?.text || '',
    sender_user_id: String(item?.sender_user_id || item?.sender?.id || item?.user_id || item?.from_id || ''),
    sender_name: item?.sender_name || item?.sender?.name || item?.user?.name || item?.from_name || 'User',
    sender_role: item?.sender_role || item?.sender?.role || item?.role || 'member',
    created_at: item?.created_at || item?.createdAt || normalizeDate(),
    read_at: item?.read_at || null,
    read_by: Array.isArray(item?.read_by) ? item.read_by : [],
    attachment_url: item?.attachment_url || item?.file_url || '',
  };
}

function getAllLocalConversations() {
  try {
    const rows = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]');
    if (Array.isArray(rows)) return rows.map(normalizeConversation);
  } catch {}
  return [];
}

function saveAllLocalConversations(rows) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(rows.map(normalizeConversation)));
}

function saveLocalConversation(conversation) {
  const rows = getAllLocalConversations();
  const normalized = normalizeConversation(conversation);
  const exists = rows.some((item) => String(item.id) === String(normalized.id));
  const next = exists ? rows.map((item) => String(item.id) === String(normalized.id) ? normalized : item) : [normalized, ...rows];
  saveAllLocalConversations(next);
  window.dispatchEvent(new CustomEvent('library-messages-updated'));
}

function getLocalConversation(conversationId) {
  return getAllLocalConversations().find((item) => String(item.id) === String(conversationId));
}

function ensureLocalConversation(conversationId) {
  const existing = getLocalConversation(conversationId);
  if (existing) return existing;

  const user = getUser();
  const role = getPrimaryRole(user);
  const isStaff = isStaffUser(user);
  const conversation = normalizeConversation({
    id: conversationId,
    subject: isStaff ? 'استفسار عضو مكتبة' : 'محادثة مع أمين المكتبة',
    participant_name: isStaff ? 'عضو مكتبة' : 'أمين المكتبة',
    member: isStaff ? { name: 'عضو مكتبة' } : user,
    librarian: { name: 'أمين المكتبة' },
    updated_at: normalizeDate(),
    last_message: isStaff ? 'أحتاج مساعدة بخصوص استعارة كتاب.' : 'مرحبًا، كيف يمكن لأمين المكتبة مساعدتك؟',
    messages: [
      {
        id: `msg-welcome-${conversationId}`,
        conversation_id: conversationId,
        body: isStaff ? 'أحتاج مساعدة بخصوص استعارة كتاب.' : 'مرحبًا، يمكنك إرسال أي استفسار حول الكتب، الاستعارات، الحجوزات أو الغرامات وسيقوم أمين المكتبة بالرد عليك.',
        sender_user_id: isStaff ? 'member-demo' : 'librarian-support',
        sender_name: isStaff ? 'عضو مكتبة' : 'أمين المكتبة',
        sender_role: isStaff ? 'member' : 'librarian',
        created_at: normalizeDate(),
        read_by: isStaff ? [] : [userKey(user)],
      },
    ],
  });
  saveLocalConversation(conversation);
  return conversation;
}

function getLocalConversationsForUser() {
  const user = getUser();
  const isStaff = isStaffUser(user);
  const rows = getAllLocalConversations();

  if (isStaff) {
    if (!rows.length) return [ensureLocalConversation('support-demo-member')];
    return rows.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  const id = `support-${userKey(user)}`;
  const own = rows.find((item) => String(item.id) === id) || ensureLocalConversation(id);
  return [own, ...rows.filter((item) => String(item.id) !== id && item.member?.id === user?.id)]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function displayParticipantName(item, user) {
  if (isStaffUser(user)) {
    return item?.member?.name || item?.user?.name || item?.sender?.name || 'عضو مكتبة';
  }
  return item?.librarian?.name || 'أمين المكتبة';
}
