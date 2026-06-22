import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpenText, CalendarDays, CreditCard, LibraryBig, MapPin, MessageCircle, Star, UserRound } from 'lucide-react';
import { apiRequest, getList, getSingle } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { personImageUrl } from '../utils/media.js';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function MemberPortal() {
  const { dt, language } = useDashboardText();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'borrowings');
  const [data, setData] = useState(null);
  const [request, setRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    display_name: '',
    nationality: '',
    birth_date: '',
    photo: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load(next = tab) {
    setTab(next);
    setSearchParams(next === 'borrowings' ? {} : { tab: next });
    setError('');
    setSuccess('');

    try {
      if (next === 'publisher-request') {
        const res = await apiRequest('/publisher-request');
        const item = getSingle(res);
        const validItem = isValidPublisherRequest(item) ? item : null;

        setRequest(validItem);

        if (validItem) {
          setRequestForm({
            display_name: validItem.display_name || '',
            nationality: validItem.nationality || '',
            birth_date: validItem.birth_date || '',
            photo: validItem.photo_url || validItem.avatar_url || validItem.photo || '',
            bio: validItem.bio || '',
          });
        }

        return;
      }

      const res = await apiRequest(`/my/${next}`);
      setData(getList(res));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load(searchParams.get('tab') || 'borrowings');
  }, []);

  async function cancelReservation(row) {
    try {
      await apiRequest(`/my/reservations/${row.id}/cancel`, { method: 'POST' });
      setSuccess(dt('reservationCancelled'));
      load('reservations');
    } catch (e) {
      setError(e.message);
    }
  }

  async function returnBorrowing(row) {
    try {
      await apiRequest(`/my/borrowings/${row.id}/return`, { method: 'POST' });
      setSuccess(dt('bookReturned'));
      load('borrowings');
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitPublisherRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const hasFile = requestForm.photo instanceof File;
      const body = hasFile ? new FormData() : JSON.stringify({
        display_name: requestForm.display_name,
        nationality: requestForm.nationality,
        birth_date: requestForm.birth_date,
        bio: requestForm.bio,
      });

      if (hasFile) {
        Object.entries(requestForm).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'photo' && !(value instanceof File)) return;
            body.append(key, value);
          }
        });
      }

      const res = await apiRequest('/publisher-request', {
        method: 'POST',
        body,
      });

      const item = getSingle(res);
      setRequest(isValidPublisherRequest(item) ? item : null);
      setSuccess(dt('publisherRequestSent'));
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const member = getMember(data);
  const validRequest = isValidPublisherRequest(request);

  return <section className="public-member-portal">
    <div className="public-container">
    <div className="page-head member-public-head">
      <h1>{dt('myLibrary')}</h1>
      <Link className="button-link small-link" to="/catalog">{dt('browseBooks')}</Link>
    </div>

    <div className="tabs">
      <button onClick={() => load('borrowings')}>{dt('myBorrowings')}</button>
      <button onClick={() => load('reservations')}>{dt('myReservations')}</button>
      <button onClick={() => load('fines')}>{dt('myFines')}</button>
      <button onClick={() => load('publisher-request')}>{dt('publisherAccountRequest')}</button>
    </div>

    <Alert type="error">{error}</Alert>
    <Alert type="success">{success}</Alert>

    {tab === 'borrowings' && Array.isArray(data) &&
      <DataTable
        title={dt('myBorrowings')}
        rows={data}
        columns={[
          { key: 'book', label: dt('book'), render: r => r.book?.title || '-' },
          { key: 'borrowed_at', label: dt('borrowedAt') },
          { key: 'due_date', label: dt('dueDate') },
          { key: 'status', label: dt('status'), render: r => translateStatusLabel(r.status, language) },
        ]}
        actions={r => r.status === 'borrowed' &&
          <button className="small" onClick={() => returnBorrowing(r)}>{dt('return')}</button>
        }
      />
    }

    {tab === 'reservations' && Array.isArray(data) &&
      <DataTable
        title={dt('myReservations')}
        rows={data}
        columns={[
          { key: 'book', label: dt('book'), render: r => r.book?.title || '-' },
          { key: 'reserved_at', label: dt('reservedAt') },
          { key: 'expires_at', label: dt('expiresAt') },
          { key: 'status', label: dt('status'), render: r => translateStatusLabel(r.status, language) },
        ]}
        actions={r => r.status === 'pending' &&
          <button className="small danger" onClick={() => cancelReservation(r)}>{dt('cancelReservation')}</button>
        }
      />
    }

    {tab === 'fines' && Array.isArray(data) &&
      <DataTable
        title={dt('myFines')}
        rows={data}
        columns={[
          { key: 'book', label: dt('book'), render: r => r.borrowing?.book?.title || '-' },
          { key: 'days_late', label: dt('daysLate') },
          { key: 'amount', label: dt('amount') },
          { key: 'status', label: dt('status'), render: r => translateStatusLabel(r.status, language) },
        ]}
      />
    }

    {tab === 'publisher-request' &&
      <div className="card wide-card">
        {validRequest ? (
          <div className="request-status">
            <h3>{dt('lastPublisherRequest')}</h3>
            <p><b>{dt('displayName')}:</b> {request.display_name || '-'}</p>
            <p><b>{dt('nationality')}:</b> {request.nationality || '-'}</p>
            <p><b>{dt('birthDate')}:</b> {request.birth_date || '-'}</p>
            <p><b>{dt('status')}:</b> <span className={`status ${request.status}`}>{translateStatusLabel(request.status, language)}</span></p>
            {personImageUrl(request) && <img className="admin-author-thumb" src={personImageUrl(request)} alt={request.display_name || 'publisher'} />}
            {request.bio && <p><b>{dt('bio')}:</b> {request.bio}</p>}
            {request.rejection_reason && <p><b>{dt('rejectionReason')}:</b> {request.rejection_reason}</p>}
            {request.status === 'approved' && <p>{dt('approvedPublisherHint')} <Link to="/publisher">{dt('goToPublisherPortal')}</Link></p>}
            {request.status === 'pending' && <p>{dt('pendingPublisherHint')}</p>}
          </div>
        ) : (
          <p className="muted">{dt('noPublisherRequest')}</p>
        )}

        {(!validRequest || request.status === 'rejected') && <>
          <h3>{dt('submitPublisherRequest')}</h3>

          <ResourceForm
            value={requestForm}
            onChange={setRequestForm}
            onSubmit={submitPublisherRequest}
            onCancel={() => load('borrowings')}
            submitting={submitting}
            fields={[
              { name: 'display_name', label: dt('publisherAuthorName'), required: true },
              { name: 'photo', label: dt('publisherAuthorPhoto'), type: 'file', accept: 'image/*' },
              { name: 'nationality', label: dt('nationality') },
              { name: 'birth_date', label: dt('birthDate'), type: 'date' },
              { name: 'bio', label: dt('aboutYou'), type: 'textarea' },
            ]}
          />
        </>}
      </div>
    }
    </div>
  </section>;
}

function MemberProfile({ member, data, dt }) {
  const photo = personImageUrl(member);
  const metrics = dashboardMetrics(data, dt);

  return <div className="member-noor-profile">
    <div className="member-main-card">
      <div className="member-top-border" />
      <div className="member-avatar-large">
        {photo ? <img src={photo} alt={memberName(member)} /> : <UserRound size={72} />}
      </div>
      <h2>{memberName(member)}</h2>
      <p className="member-role">{dt('memberReaderRole')}</p>
      <Link className="profile-message-btn" to="/catalog"><MessageCircle size={17} /> {dt('browseNewBook')}</Link>

      <div className="member-fact-grid">
        <ProfileFact icon={MapPin} label={dt('country')} value={member?.country || member?.nationality || 'Palestine'} />
        <ProfileFact icon={CalendarDays} label={dt('lastSeen')} value={dt('onlineNow')} />
        <ProfileFact icon={Star} label={dt('rating')} value="0 / 5" />
        <ProfileFact icon={CreditCard} label={dt('membershipNumber')} value={member?.membership_number || '-'} />
      </div>

      <div className="member-library-stats">
        {metrics.slice(0, 3).map((item) => <span key={item.key}><LibraryBig size={24} /><b>{item.value}</b><small>{item.label}</small></span>)}
      </div>
    </div>

    <div className="member-empty-books">
      <BookOpenText size={62} />
      <p>{dt('memberEmptyNote')}</p>
    </div>
  </div>;
}

function ProfileFact({ icon: Icon, label, value }) {
  return <div className="profile-fact">
    <Icon size={25} />
    <span>{label}</span>
    <b>{value}</b>
  </div>;
}

function getMember(data) {
  if (!data) return null;
  if (data.member?.data) return data.member.data;
  if (data.member) return data.member;
  return null;
}

function memberName(member) {
  if (!member) return '-';
  if (member.name) return member.name;
  const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ');
  return fullName || '-';
}

function dashboardMetrics(data, dt) {
  return [
    { key: 'borrowed_count', label: dt('borrowedCount'), value: pickFirst(data, ['borrowed_count', 'borrowings_count', 'active_borrowings_count'], 0) },
    { key: 'returned_count', label: dt('returnedCount'), value: pickFirst(data, ['returned_count', 'returned_borrowings_count'], 0) },
    { key: 'overdue_count', label: dt('overdueCount'), value: pickFirst(data, ['overdue_count', 'overdue_borrowings_count'], 0) },
    { key: 'pending_reservations_count', label: dt('pendingReservations'), value: pickFirst(data, ['pending_reservations_count', 'reservations_count'], 0) },
    { key: 'unpaid_fines_count', label: dt('unpaidFinesCount'), value: pickFirst(data, ['unpaid_fines_count'], 0) },
    { key: 'unpaid_fines_amount', label: dt('unpaidFinesAmount'), value: pickFirst(data, ['unpaid_fines_amount'], 0) },
  ];
}

function pickFirst(obj, keys, defaultValue = '-') {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return defaultValue;
}

function isValidPublisherRequest(item) {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.status || item.display_name));
}
