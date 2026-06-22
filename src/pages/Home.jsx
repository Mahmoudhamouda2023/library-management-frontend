import { useEffect, useState } from 'react';
import { apiRequest, getUser } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Home() {
  const user = getUser();
  const { dt } = useDashboardText();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/reports/summary')
      .then((res) => setSummary(res.data || res))
      .catch(() => setError(dt('reportsPermissionError')));
  }, [dt]);

  const cards = summary ? [
    [dt('totalBooks'), summary.books_count ?? summary.total_books],
    [dt('totalMembers'), summary.members_count ?? summary.total_members],
    [dt('activeBorrowings'), summary.active_borrowings ?? summary.borrowed_books],
    [dt('pendingReservations'), summary.pending_reservations],
  ] : [];

  return (
    <section>
      <h1>{dt('welcome')} {user?.name}</h1>
      <Alert>{error}</Alert>
      <div className="cards">
        {cards.length ? cards.map(([label, value]) => (
          <div className="card" key={label}><span>{label}</span><strong>{value ?? 0}</strong></div>
        )) : (
          <>
            <div className="card"><span>{dt('role')}</span><strong>{user?.roles?.join(', ')}</strong></div>
            <div className="card"><span>{dt('permissions')}</span><strong>{user?.permissions?.length || 0}</strong></div>
          </>
        )}
      </div>
    </section>
  );
}
