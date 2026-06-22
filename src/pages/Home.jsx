import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Library,
  Search,
  Users,
} from 'lucide-react';
import { apiRequest, getUser } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Home() {
  const user = getUser();
  const { dt } = useDashboardText();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    apiRequest('/reports/summary')
      .then((res) => {
        if (isMounted) setSummary(res.data || res || {});
      })
      .catch(() => {
        if (isMounted) setError(dt('reportsPermissionError'));
      });

    return () => {
      isMounted = false;
    };
  }, [dt]);

  const dashboard = summary || {};
  const stats = useMemo(() => buildStats(dashboard, dt), [dashboard, dt]);
  const trend = Array.isArray(dashboard.borrowing_trend) ? dashboard.borrowing_trend : [];
  const categories = Array.isArray(dashboard.category_distribution) ? dashboard.category_distribution : [];
  const recentBorrowings = Array.isArray(dashboard.recent_borrowings) ? dashboard.recent_borrowings : [];
  const pendingRequests = Array.isArray(dashboard.publisher_requests) ? dashboard.publisher_requests : [];
  const pendingBooks = Array.isArray(dashboard.pending_books) ? dashboard.pending_books : [];

  const filteredBorrowings = filterRows(recentBorrowings, search, ['member_name', 'book_title', 'status']);
  const filteredRequests = filterRows(pendingRequests.length ? pendingRequests : pendingBooks, search, [
    'display_name',
    'user_name',
    'title',
    'author_name',
    'category_name',
  ]);

  return (
    <section className="modern-dashboard">
      <div className="dashboard-topbar">
        <div>
          <h1>{dt('adminDashboard')}</h1>
          <p>Overview of books, members, borrowings, reservations and publisher requests.</p>
        </div>

        <div className="dashboard-actions">
          <label className="dashboard-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resources..."
              type="search"
            />
          </label>
          <Link to="/admin/books" className="dashboard-add-button">
            + Add New Book
          </Link>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="dashboard-badges" aria-label="Project stack">
        <span className="badge-blue">React Frontend</span>
        <span className="badge-green">Laravel REST API</span>
        <span className="badge-yellow">Role-Based Access</span>
      </div>

      <div className="dashboard-stat-grid">
        {stats.map((item) => (
          <article className="dashboard-stat-card" key={item.label}>
            <span className={`stat-icon ${item.color}`}>{item.icon}</span>
            <div>
              <p>{item.label}</p>
              <strong>{formatNumber(item.value)}</strong>
              <small className={item.tone}>{item.note}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid-main">
        <article className="dashboard-panel dashboard-chart-panel">
          <PanelTitle
            title="Borrowing Trend"
            subtitle="Monthly borrowing activity from the library system"
            action="Borrowings"
          />
          <BorrowingTrendChart data={trend} />
        </article>

        <article className="dashboard-panel dashboard-categories-panel">
          <PanelTitle title="Book Categories" subtitle="Distribution by library sections" />
          <div className="category-bars">
            {categories.length ? categories.map((category, index) => (
              <div className="category-row" key={category.id || category.name}>
                <span>{category.name}</span>
                <div className="category-bar-track">
                  <b className={`category-bar-fill fill-${index % 5}`} style={{ width: `${Math.max(category.percentage || 0, 4)}%` }} />
                </div>
                <em>{category.percentage || 0}%</em>
              </div>
            )) : <EmptyState text="No categories data yet" />}
          </div>
        </article>
      </div>

      <div className="dashboard-grid-bottom">
        <article className="dashboard-panel recent-table-panel">
          <PanelTitle title="Recent Borrowings" subtitle="Latest lending records from member portal" />
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBorrowings.length ? filteredBorrowings.map((row) => (
                  <tr key={row.id}>
                    <td>{row.member_name}</td>
                    <td>{row.book_title}</td>
                    <td>{row.due_date || '-'}</td>
                    <td><StatusPill status={row.is_overdue ? 'overdue' : row.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan="4"><EmptyState text="No recent borrowings yet" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-panel requests-panel">
          <PanelTitle title="Publisher Requests" subtitle="Books or publishers waiting for admin approval" />
          <div className="publisher-request-list">
            {filteredRequests.length ? filteredRequests.map((item) => (
              <div className="publisher-request-card" key={`${item.id}-${item.display_name || item.title}`}>
                <span className="request-dot" />
                <div>
                  <strong>{item.display_name || item.title}</strong>
                  <small>{item.user_name || item.author_name || item.category_name || 'Pending review'}</small>
                </div>
                <Link to={item.title ? '/admin/books/pending' : '/admin/publisher-requests'}>Review</Link>
              </div>
            )) : <EmptyState text="No pending publisher requests" />}
          </div>
        </article>
      </div>
    </section>
  );
}

function buildStats(data, dt) {
  const totalBooks = pickNumber(data.total_books, data.books_count, data.books?.total_books);
  const totalMembers = pickNumber(data.active_members, data.members?.active_members, data.total_members, data.members_count);
  const activeBorrowings = pickNumber(data.active_borrowings, data.borrowed_books, data.borrowings?.currently_borrowed);
  const pendingRequests = pickNumber(data.pending_requests_total, data.pending_publisher_requests, data.pending_publisher_books, data.pending_reservations, data.reservations?.pending);

  return [
    {
      label: dt('totalBooks'),
      value: totalBooks,
      note: `+${pickNumber(data.new_books_this_week)} this week`,
      color: 'blue',
      tone: 'positive',
      icon: <BookOpen size={20} />,
    },
    {
      label: dt('activeMembers'),
      value: totalMembers,
      note: `+${pickNumber(data.new_members_this_week)} new`,
      color: 'green',
      tone: 'positive',
      icon: <Users size={20} />,
    },
    {
      label: dt('borrowings'),
      value: activeBorrowings,
      note: `${pickNumber(data.due_soon_borrowings)} due soon`,
      color: 'orange',
      tone: 'warning',
      icon: <Library size={20} />,
    },
    {
      label: 'Pending Requests',
      value: pendingRequests,
      note: `${pickNumber(data.pending_publisher_books)} publisher books`,
      color: 'purple',
      tone: 'purple-note',
      icon: <CheckCircle2 size={20} />,
    },
  ];
}

function PanelTitle({ title, subtitle, action }) {
  return (
    <div className="panel-title-row">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action ? <span className="panel-action"><ArrowUpRight size={15} /> {action}</span> : null}
    </div>
  );
}

function BorrowingTrendChart({ data }) {
  const points = Array.isArray(data) && data.length ? data : buildEmptyTrend();
  const max = Math.max(...points.map((point) => Number(point.count || 0)), 1);
  const width = 760;
  const height = 230;
  const padding = { top: 22, right: 26, bottom: 36, left: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const coordinates = points.map((point, index) => {
    const x = padding.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((Number(point.count || 0) / max) * innerHeight);
    return { ...point, x, y };
  });

  const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${coordinates.at(-1)?.x || padding.left} ${height - padding.bottom} L ${coordinates[0]?.x || padding.left} ${height - padding.bottom} Z`;

  return (
    <div className="chart-responsive">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Borrowing trend chart">
        {[0, 1, 2, 3].map((line) => {
          const y = padding.top + (line / 3) * innerHeight;
          return <line key={line} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-grid-line" />;
        })}
        <path d={areaPath} className="chart-area" />
        <path d={path} className="chart-line" />
        {coordinates.map((point) => (
          <g key={point.month || point.label}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            <text x={point.x} y={height - 10} textAnchor="middle" className="chart-label">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusPill({ status }) {
  const value = String(status || 'pending').toLowerCase();
  return <span className={`dashboard-status status-${value}`}>{value}</span>;
}

function EmptyState({ text }) {
  return (
    <div className="dashboard-empty">
      <Clock3 size={18} />
      <span>{text}</span>
    </div>
  );
}

function buildEmptyTrend() {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((label) => ({ label, count: 0 }));
}

function pickNumber(...values) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  const number = Number(found || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function filterRows(rows, search, keys) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;

  return rows.filter((row) => keys.some((key) => String(row?.[key] || '').toLowerCase().includes(query)));
}
