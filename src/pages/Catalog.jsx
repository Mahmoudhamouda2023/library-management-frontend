import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Filter, Grid3X3, ListFilter, Loader2, Search, Table2, X } from 'lucide-react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { bookCoverUrl } from '../utils/media.js';

function fallbackCategories(t) {
  return [
    { id: 'science', name: t('fallbackScience') },
    { id: 'literature', name: t('fallbackLiterature') },
    { id: 'technology', name: t('fallbackTechnology') },
    { id: 'history', name: t('fallbackHistory') },
    { id: 'religion', name: t('fallbackReligion') },
    { id: 'novel', name: t('fallbackNovel') },
  ];
}

export default function Catalog() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const firstRun = useRef(true);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    available: searchParams.get('available') || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('cards');

  function buildParams(nextFilters) {
    const params = new URLSearchParams();
    if (nextFilters.search) params.set('search', nextFilters.search);
    if (nextFilters.category_id) params.set('category_id', nextFilters.category_id);
    if (nextFilters.available) params.set('available', nextFilters.available);
    return params;
  }

  async function load(nextFilters = filters, syncUrl = true) {
    setLoading(true);
    setError('');
    try {
      const params = buildParams(nextFilters);
      const query = params.toString() ? `?${params}` : '';
      const res = await apiRequest(`/public/books${query}`);
      setBooks(getList(res));
      if (syncUrl) setSearchParams(params, { replace: true });
    } catch (err) {
      setBooks([]);
      setError(err.message || t('loadCatalogError'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    apiRequest('/public/categories')
      .then((res) => {
        const list = getList(res);
        setCategories(list.length ? list : fallbackCategories(t));
      })
      .catch(() => setCategories(fallbackCategories(t)));
  }, [t]);

  useEffect(() => {
    const delay = firstRun.current ? 0 : 350;
    firstRun.current = false;
    const timer = window.setTimeout(() => load(filters), delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category_id, filters.available]);

  const selectedCategoryName = useMemo(() => {
    return categories.find((category) => String(category.id) === String(filters.category_id))?.name || t('allCategories');
  }, [categories, filters.category_id, t]);

  const tableColumns = [
    {
      key: 'title',
      label: t('titleColumn'),
      sortable: true,
      render: (book) => <Link className="table-book-link" to={`/catalog/${book.id}`}>{book.title}</Link>,
    },
    { key: 'author', label: t('authorColumn'), sortable: true, render: (book) => book.author?.name || book.author_name || '-' },
    { key: 'category', label: t('categoryColumn'), sortable: true, render: (book) => book.category?.name || book.category_name || '-' },
    { key: 'isbn', label: 'ISBN', sortable: true, render: (book) => book.isbn || '-' },
    { key: 'published_year', label: t('yearColumn'), sortable: true, render: (book) => book.published_year || '-' },
    { key: 'available_copies', label: t('availableColumn'), sortable: true, render: (book) => book.available_copies ?? 0 },
  ];

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function submit(e) {
    e.preventDefault();
    load(filters);
  }

  function chooseCategory(categoryId) {
    setFilters((current) => ({ ...current, category_id: categoryId ? String(categoryId) : '' }));
  }

  function resetFilters() {
    setFilters({ search: '', category_id: '', available: '' });
  }

  return (
    <main className="public-main official-public-main catalog-page">
      <section className="catalog-hero-mini">
        <div className="public-container">
          <p><BookOpen size={18} /> {t('catalog')}</p>
          <h1>{t('catalogHeroTitle')}</h1>
          <span>{t('catalogHeroText')}</span>
        </div>
      </section>

      <section className="public-container catalog-layout">
        <aside className="catalog-sidebar">
          <div className="sidebar-title">
            <ListFilter size={19} />
            <h2>{t('sections')}</h2>
          </div>
          <button className={!filters.category_id ? 'category-filter active' : 'category-filter'} onClick={() => chooseCategory('')}>
            {t('allCategories')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id || category.name}
              className={String(filters.category_id) === String(category.id) ? 'category-filter active' : 'category-filter'}
              onClick={() => chooseCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </aside>

        <div className="catalog-content">
          <form className="catalog-filter-panel ajax-filter-panel" onSubmit={submit}>
            <div className="filter-title">
              <Filter size={20} />
              <div>
                <strong>{t('searchFilter')}</strong>
                <span>{selectedCategoryName}</span>
              </div>
            </div>

            <label className="search-field live-search-field">
              <Search size={18} />
              <input
                placeholder={t('searchBookPlaceholder')}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
              {loading && <Loader2 className="spin" size={16} />}
            </label>

            <select value={filters.category_id} onChange={(e) => updateFilter('category_id', e.target.value)}>
              <option value="">{t('allCategories')}</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>

            <select value={filters.available} onChange={(e) => updateFilter('available', e.target.value)}>
              <option value="">{t('allBooks')}</option>
              <option value="true">{t('availableOnly')}</option>
            </select>

            <button type="submit">{loading ? t('searching') : t('apply')}</button>
            <button type="button" className="secondary reset-filter" onClick={resetFilters}><X size={16} /> {t('clear')}</button>
            <small className="ajax-note">بحث Ajax مباشر بدون إعادة تحميل الصفحة</small>
          </form>

          <Alert type="error">{error}</Alert>

          <div className="catalog-toolbar-row">
            <div>
              <strong>{books.length}</strong>
              <span>{t('booksMatched')}</span>
            </div>
            <div className="view-switcher">
              <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><Grid3X3 size={17} /> {t('cards')}</button>
              <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={17} /> {t('dataTable')}</button>
            </div>
          </div>

          {loading && <div className="empty-card">{t('loading')}</div>}

          {!loading && view === 'cards' && (
            <div className="compact-book-grid catalog-books-grid">
              {books.map((book) => <CatalogBookCard key={book.id} book={book} t={t} />)}
              {!books.length && <div className="empty-card official-empty">{t('noBooksMatch')}</div>}
            </div>
          )}

          {!loading && view === 'table' && (
            <DataTable
              title={t('tableTitle')}
              columns={tableColumns}
              rows={books}
              pageSize={10}
              searchable
              exportable
              actions={(book) => <Link className="table-action-link" to={`/catalog/${book.id}`}>{t('details')}</Link>}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function CatalogBookCard({ book, t }) {
  const category = book.category?.name || book.category_name || t('undefinedCategory');
  const author = book.author?.name || book.author_name || t('undefinedAuthor');
  const cover = bookCoverUrl(book);

  return (
    <article className="public-book-card catalog-card">
      <Link to={`/catalog/${book.id}`} className="book-cover">
        {cover ? <img src={cover} alt={book.title} /> : <BookCoverFallback title={book.title} category={category} />}
      </Link>
      <div className="book-card-body">
        <span className="book-badge">{category}</span>
        <h3><Link to={`/catalog/${book.id}`}>{book.title}</Link></h3>
        <p>{author}</p>
        <div className="mini-meta">
          <span>{t('isbnPrefix')}: {book.isbn || '-'}</span>
          <span>{t('availablePrefix')}: {book.available_copies ?? 0}</span>
        </div>
      </div>
    </article>
  );
}

function BookCoverFallback({ title = 'Book', category = 'Library' }) {
  return (
    <div className="cover-fallback">
      <span>{category}</span>
      <strong>{title.split(' ').filter(Boolean).slice(0, 3).join(' ') || title}</strong>
      <small>Library System</small>
    </div>
  );
}
