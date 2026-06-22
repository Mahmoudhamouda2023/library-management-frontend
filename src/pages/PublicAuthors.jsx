import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Grid3X3, Loader2, Search, Table2, UserRound, UsersRound } from 'lucide-react';
import { apiRequest, getList } from '../api/client.js';
import DataTable from '../components/DataTable.jsx';
import Alert from '../components/Alert.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { personImageUrl } from '../utils/media.js';

function fallbackAuthors() {
  return [
    { id: 'a1', name: 'محمود محمد', nationality: 'فلسطين', books_count: 0, bio: 'مؤلف مسجل في المكتبة' },
    { id: 'a2', name: 'محمد أحمد', nationality: 'فلسطين', books_count: 3, bio: 'كاتب وباحث' },
    { id: 'a3', name: 'أحمد خالد', nationality: 'الأردن', books_count: 7, bio: 'مؤلف في مجال المعرفة العامة' },
    { id: 'a4', name: 'سارة علي', nationality: 'فلسطين', books_count: 2, bio: 'كاتبة في الأدب والتعليم' },
  ];
}

export default function PublicAuthors() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authors, setAuthors] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [view, setView] = useState('cards');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(query = search) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      const suffix = params.toString() ? `?${params}` : '';
      const res = await apiRequest(`/public/authors${suffix}`);
      const list = getList(res);
      setAuthors(list.length ? list : fallbackAuthors());
      setSearchParams(params, { replace: true });
    } catch (e) {
      setAuthors(fallbackAuthors());
      setError('تعذر تحميل المؤلفين من الخادم، لذلك تم عرض بيانات تجريبية للواجهة.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => load(search), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = [
    { key: 'photo', label: t('authorPhoto'), sortable: false, render: (author) => <AuthorAvatar author={author} small /> },
    { key: 'name', label: t('authorName'), sortable: true },
    { key: 'nationality', label: t('authorNationality'), sortable: true, render: (author) => author.nationality || '-' },
    { key: 'books_count', label: t('booksCount'), sortable: true, render: (author) => author.books_count ?? author.books?.length ?? 0 },
    { key: 'bio', label: t('authorBio'), sortable: false, render: (author) => author.bio || '-' },
  ];

  return <main className="public-main official-public-main authors-public-page">
    <section className="catalog-hero-mini authors-hero">
      <div className="public-container">
        <p><UsersRound size={18} /> {t('authorsNav')}</p>
        <h1>{t('authorsPageTitle')}</h1>
        <span>{t('authorsPageText')}</span>
      </div>
    </section>

    <section className="public-container authors-layout">
      <aside className="catalog-sidebar authors-sidebar">
        <div className="sidebar-title"><UserRound size={19} /><h2>{t('authorsFilter')}</h2></div>
        <div className="author-search-box">
          <Search size={17} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchAuthorPlaceholder')} />
          {loading && <Loader2 className="spin" size={16} />}
        </div>
        <Link className="soft-cta" to="/catalog"><BookOpen size={16} /> {t('catalog')}</Link>
      </aside>

      <div className="authors-content">
        <Alert type="error">{error}</Alert>
        <div className="catalog-toolbar-row">
          <div><strong>{authors.length}</strong><span>{t('authorsMatched')}</span></div>
          <div className="view-switcher">
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><Grid3X3 size={17} /> {t('cards')}</button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={17} /> {t('dataTable')}</button>
          </div>
        </div>

        {loading && <div className="empty-card">{t('loadingAuthors')}</div>}

        {!loading && view === 'cards' && <div className="authors-card-grid">
          {authors.map((author) => <AuthorCard key={author.id || author.name} author={author} t={t} />)}
        </div>}

        {!loading && view === 'table' && <DataTable title={t('authorsTableTitle')} columns={columns} rows={authors} pageSize={10} />}
      </div>
    </section>
  </main>;
}

function AuthorCard({ author, t }) {
  return <article className="author-public-card">
    <AuthorAvatar author={author} />
    <h2>{author.name || '-'}</h2>
    <p>{author.bio || t('noDescriptionShort')}</p>
    <div className="author-card-meta">
      <span>{author.nationality || '-'}</span>
      <span>{author.books_count ?? author.books?.length ?? 0} {t('booksShort')}</span>
    </div>
    <Link to={`/catalog?author_id=${author.id || ''}&search=${encodeURIComponent(author.name || '')}`}>{t('viewAuthorBooks')}</Link>
  </article>;
}

function AuthorAvatar({ author, small = false }) {
  const photo = personImageUrl(author);
  const initials = String(author.name || 'م').slice(0, 1);
  return <div className={small ? 'author-public-avatar small' : 'author-public-avatar'}>
    {photo ? <img src={photo} alt={author.name} /> : <span>{initials}</span>}
  </div>;
}
