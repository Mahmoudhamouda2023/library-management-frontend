import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookCopy,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  LibraryBig,
  Loader2,
  Search,
  Sparkles,
  Tags,
  UsersRound,
} from 'lucide-react';
import { apiRequest, getList } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { bookCoverUrl } from '../utils/media.js';

function fallbackCategories(t) {
  return [
    { id: 'science', name: t('fallbackScience'), description: t('sectionBooksHint') },
    { id: 'literature', name: t('fallbackLiterature'), description: t('sectionBooksHint') },
    { id: 'technology', name: t('fallbackTechnology'), description: t('sectionBooksHint') },
    { id: 'history', name: t('fallbackHistory'), description: t('sectionBooksHint') },
    { id: 'management', name: t('fallbackManagement'), description: t('sectionBooksHint') },
    { id: 'education', name: t('fallbackEducation'), description: t('sectionBooksHint') },
  ];
}

export default function PublicHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadHomeData() {
      setLoading(true);
      try {
        const [booksRes, categoriesRes] = await Promise.all([
          apiRequest('/public/books?available=true').catch(() => null),
          apiRequest('/public/categories').catch(() => null),
        ]);

        if (!alive) return;
        setBooks(getList(booksRes).slice(0, 16));
        const loadedCategories = getList(categoriesRes);
        setCategories(loadedCategories.length ? loadedCategories.slice(0, 18) : fallbackCategories(t));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHomeData();
    return () => { alive = false; };
  }, [t]);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      return undefined;
    }

    setSuggesting(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiRequest(`/public/books?search=${encodeURIComponent(query)}&available=true`);
        setSuggestions(getList(res).slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const stats = useMemo(() => ([
    { label: t('booksInCatalog'), value: books.length ? `${books.length}+` : '—', icon: LibraryBig },
    { label: t('knowledgeSection'), value: categories.length ? `${categories.length}+` : '—', icon: Tags },
    { label: t('memberServices'), value: '24/7', icon: UsersRound },
    { label: t('publisherManagement'), value: t('availableBooks'), icon: Building2 },
  ]), [books.length, categories.length, t]);

  function submitSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate(`/catalog${params.toString() ? `?${params}` : ''}`);
  }

  return (
    <main className="public-main official-public-main">
      <section className="noor-inspired-hero">
        <div className="hero-pattern" />
        <div className="public-container hero-content">
          <p className="hero-kicker"><Sparkles size={18} /> {t('heroKicker')}</p>
          <h1>{t('heroTitle')}</h1>
          <p className="hero-summary">{t('heroSummary')}</p>

          <div className="hero-search-wrap">
            <form className="hero-search ajax-hero-search" onSubmit={submitSearch}>
              <Search size={21} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('heroPlaceholder')}
              />
              {suggesting && <Loader2 className="spin" size={18} />}
              <button type="submit">{t('searchButton')}</button>
            </form>

            {(suggestions.length > 0 || suggesting) && (
              <div className="ajax-suggestions-panel">
                <strong>نتائج مباشرة</strong>
                {suggestions.map((book) => (
                  <Link key={book.id} to={`/catalog/${book.id}`}>
                    <span>{book.title}</span>
                    <small>{book.author?.name || book.author_name || t('undefinedAuthor')}</small>
                  </Link>
                ))}
                {!suggestions.length && suggesting && <p>جارٍ البحث...</p>}
              </div>
            )}
          </div>

          <div className="hero-shortcuts" id="library-sections">
            <Link to="/catalog?available=true">{t('availableBooks')}</Link>
            <Link to="/catalog">{t('latestBooks')}</Link>
            <Link to="/authors">{t('authorsNav')}</Link>
            <Link to="/login">{t('systemLogin')}</Link>
          </div>
        </div>
      </section>

      <section className="public-container stats-strip" aria-label="Library statistics">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="stat-tile">
              <Icon size={32} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          );
        })}
      </section>

      <section className="public-container portal-grid">
        <aside className="public-sidebar-card">
          <div className="sidebar-title">
            <Tags size={19} />
            <h2>{t('bookSectionsTitle')}</h2>
          </div>

          <div className="category-list official-list">
            {categories.map((category) => (
              <Link key={category.id || category.name} to={`/catalog?category_id=${category.id || ''}`}>
                <span>{category.name}</span>
                <ChevronLeft size={16} />
              </Link>
            ))}
          </div>

          <Link className="soft-cta" to="/sections">
            {t('showAllSections')} <ArrowLeft size={16} />
          </Link>
        </aside>

        <div className="content-column">
          <div className="section-tabs">
            <Link to="/catalog?available=true" className="active"><BookOpenCheck size={19} /> {t('availableToday')}</Link>
            <Link to="/catalog"><Clock3 size={19} /> {t('latestBooks')}</Link>
            <Link to="/catalog"><BookCopy size={19} /> {t('mostCirculated')}</Link>
          </div>

          <section className="public-section polished-section">
            <div className="section-heading">
              <div>
                <p>{t('libraryPicks')}</p>
                <h2>{t('suggestedBooks')}</h2>
              </div>
              <Link to="/catalog">{t('showAll')} <ArrowLeft size={16} /></Link>
            </div>

            {loading && <div className="empty-card">{t('loadingBooks')}</div>}

            {!loading && books.length > 0 && (
              <div className="compact-book-grid">
                {books.slice(0, 12).map((book) => <PublicBookCard key={book.id} book={book} t={t} />)}
              </div>
            )}

            {!loading && !books.length && (
              <div className="empty-card official-empty">
                {t('noBooksHome')}
              </div>
            )}
          </section>

          <section className="publisher-panel" id="publisher-area">
            <div>
              <p>{t('publisherPanelEyebrow')}</p>
              <h2>{t('publisherPanelTitle')}</h2>
              <span>{t('publisherPanelText')}</span>
            </div>
            <Link to="/publisher-services" className="button-link">{t('publisherServices')}</Link>
          </section>

          <section className="workflow-row">
            <WorkflowItem icon={FileText} title={t('organizedIndexing')} text={t('organizedIndexingText')} />
            <WorkflowItem icon={CheckCircle2} title={t('reviewApprove')} text={t('reviewApproveText')} />
            <WorkflowItem icon={UsersRound} title={t('membershipsBorrowing')} text={t('membershipsBorrowingText')} />
          </section>
        </div>
      </section>
    </main>
  );
}

function WorkflowItem({ icon: Icon, title, text }) {
  return (
    <article>
      <Icon size={26} />
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}

function PublicBookCard({ book, t }) {
  const cover = bookCoverUrl(book);
  const category = book.category?.name || book.category_name || t('undefinedCategory');
  const author = book.author?.name || book.author_name || t('undefinedAuthor');

  return (
    <article className="public-book-card">
      <Link to={`/catalog/${book.id}`} className="book-cover" aria-label={`${t('details')}: ${book.title}`}>
        {cover ? <img src={cover} alt={book.title} /> : <BookCoverFallback title={book.title} category={category} />}
      </Link>

      <div className="book-card-body">
        <span className="book-badge">{category}</span>
        <h3><Link to={`/catalog/${book.id}`}>{book.title}</Link></h3>
        <p>{author}</p>
        <div className="mini-meta">
          <span>{t('availablePrefix')}: {book.available_copies ?? 0}</span>
          <span>{book.published_year || t('undefinedYear')}</span>
        </div>
      </div>
    </article>
  );
}

function BookCoverFallback({ title = 'كتاب', category = 'مكتبة' }) {
  const words = title.split(' ').filter(Boolean).slice(0, 3).join(' ');
  return (
    <div className="cover-fallback">
      <span>{category}</span>
      <strong>{words || title}</strong>
      <small>Library System</small>
    </div>
  );
}
