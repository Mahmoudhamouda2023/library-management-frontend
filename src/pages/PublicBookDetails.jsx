import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  Download,
  Hash,
  LibraryBig,
  MapPin,
  MessageSquare,
  Star,
  Tags,
  UserRound,
} from 'lucide-react';
import { apiRequest, getList, getSingle, getToken, getUser } from '../api/client.js';
import { hasRole } from '../auth/permissions.js';
import Alert from '../components/Alert.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { bookCoverUrl } from '../utils/media.js';

export default function PublicBookDetails() {
  const { id } = useParams();
  const token = getToken();
  const user = getUser();
  const { t } = useLanguage();
  const [book, setBook] = useState(null);
  const [categories, setCategories] = useState([]);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingAction, setLoadingAction] = useState('');

  useEffect(() => {
    setError('');
    setBook(null);

    apiRequest(`/public/books/${id}`)
      .then((res) => setBook(getSingle(res)))
      .catch((err) => setError(err.message || t('bookLoadError')));

    apiRequest('/public/categories')
      .then((res) => setCategories(getList(res).slice(0, 20)))
      .catch(() => setCategories([]));
  }, [id, t]);

  useEffect(() => {
    if (!book) return;
    const categoryId = book.category?.id || book.category_id;
    const query = categoryId ? `?category_id=${categoryId}` : '?available=true';
    apiRequest(`/public/books${query}`)
      .then((res) => setRelatedBooks(getList(res).filter((item) => String(item.id) !== String(book.id)).slice(0, 8)))
      .catch(() => setRelatedBooks([]));
  }, [book]);

  async function memberAction(type) {
    setError('');
    setSuccess('');
    setLoadingAction(type);
    try {
      const options = type === 'borrow'
        ? { method: 'POST', body: JSON.stringify({ due_date: dueDateAfterDays(14) }) }
        : { method: 'POST' };
      await apiRequest(`/my/books/${id}/${type}`, options);
      setSuccess(type === 'borrow' ? t('borrowSuccess') : t('reserveSuccess'));
      const res = await apiRequest(`/public/books/${id}`);
      setBook(getSingle(res));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction('');
    }
  }

  const category = book?.category?.name || book?.category_name || t('undefinedCategory');
  const author = book?.author?.name || book?.author_name || '-';
  const cover = bookCoverUrl(book);
  const isAvailable = Number(book?.available_copies || 0) > 0;
  const isStaff = hasRole(user, 'admin') || hasRole(user, 'librarian');
  const isPublisher = hasRole(user, 'publisher');
  const canUseReaderActions = Boolean(token && hasRole(user, 'member') && !isStaff && !isPublisher);

  return (
    <main className="public-main official-public-main details-page noor-book-detail-page">
      <section className="public-container noor-detail-layout">
        <aside className="detail-side-list">
          <div className="sidebar-title"><Tags size={18} /><h2>{t('sections')}</h2></div>
          <div className="category-list official-list">
            {categories.map((item) => (
              <Link key={item.id || item.name} to={`/catalog?category_id=${item.id || ''}`}>
                <span>{item.name}</span>
                <ChevronLeft size={15} />
              </Link>
            ))}
          </div>
          <Link className="soft-cta" to="/sections">{t('showAllSections')}</Link>
        </aside>

        <div className="noor-detail-content">
          <Link className="back-link" to="/catalog"><ArrowRight size={17} /> {t('backToCatalog')}</Link>
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>

          {!book && !error && <div className="empty-card">{t('loadingBookDetails')}</div>}

          {book && (
            <>
              <article className="noor-book-main-card">
                <div className="noor-book-header">
                  <div>
                    <span>{t('bookDetailsPage')}</span>
                    <h1>{book.title}</h1>
                    <p>{author}</p>
                  </div>
                  <span className={isAvailable ? 'availability-badge available' : 'availability-badge unavailable'}>
                    {isAvailable ? t('availableForBorrow') : t('unavailableNow')}
                  </span>
                </div>

                <div className="noor-book-info-row">
                  <div className="noor-cover-box">
                    {cover ? <img src={cover} alt={book.title} /> : <BookCoverFallback title={book.title} category={category} />}
                  </div>

                  <div className="noor-book-meta-panel">
                    <InfoLine icon={UserRound} label={t('authorLabel')} value={author} />
                    <InfoLine icon={Tags} label={t('categoryColumn')} value={category} />
                    <InfoLine icon={Hash} label="ISBN" value={book.isbn || '-'} />
                    <InfoLine icon={CalendarDays} label={t('yearColumn')} value={book.published_year || '-'} />
                    <InfoLine icon={MapPin} label={t('shelfLocation')} value={book.shelf_location || '-'} />
                    <InfoLine icon={LibraryBig} label={t('totalCopies')} value={book.total_copies ?? 0} />
                    <InfoLine icon={BookOpen} label={t('availableCopies')} value={book.available_copies ?? 0} />
                  </div>
                </div>

                <div className="noor-book-actions">
                  {!token && <Link className="button-link" to="/login">{t('loginToBorrow')}</Link>}
                  {canUseReaderActions && (
                    <>
                      <button disabled={loadingAction === 'borrow' || !isAvailable} onClick={() => memberAction('borrow')}>
                        {loadingAction === 'borrow' ? t('processing') : t('borrowBook')}
                      </button>
                      <button className="secondary" disabled={loadingAction === 'reserve'} onClick={() => memberAction('reserve')}>
                        {loadingAction === 'reserve' ? t('processing') : t('reserveBook')}
                      </button>
                    </>
                  )}
                  {token && isStaff && <Link className="button-link" to={hasRole(user, 'admin') ? '/admin/books' : '/librarian/books'}>{t('manageBooks')}</Link>}
                  {token && isPublisher && <Link className="button-link" to="/publisher?tab=books">{t('manageBooks')}</Link>}
                  <Link className="button-link secondary-link" to={`/authors?search=${encodeURIComponent(author)}`}>{t('authorsNav')}</Link>
                </div>
              </article>

              <section className="noor-description-card">
                <h2>{t('bookDescriptionTitle')}</h2>
                <p>{book.description || t('noDescription')}</p>
              </section>

              {!isStaff && !isPublisher && <section className="noor-reader-services">
                <ServiceCircle icon={BookOpenCheck} label={t('borrowBook')} />
                <ServiceCircle icon={Download} label={t('reserveBook')} />
                <ServiceCircle icon={MessageSquare} label={t('bookReviews')} />
              </section>}

              <section className="rating-comments-card">
                <div className="rating-summary">
                  <strong>0.0</strong>
                  <span><Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} /><Star size={17} /></span>
                  <small>{t('noReviewsYet')}</small>
                </div>
                <div className="comment-placeholder">{t('commentsPlaceholder')}</div>
              </section>

              {relatedBooks.length > 0 && (
                <section className="public-section polished-section related-detail-books">
                  <div className="section-heading">
                    <div>
                      <p>{t('relatedBooks')}</p>
                      <h2>{category}</h2>
                    </div>
                    <Link to={`/catalog?category_id=${book.category?.id || book.category_id || ''}`}>{t('showAll')}</Link>
                  </div>
                  <div className="compact-book-grid">
                    {relatedBooks.map((item) => <RelatedBookCard key={item.id} book={item} t={t} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function dueDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function InfoLine({ icon: Icon, label, value }) {
  return <div className="info-line"><Icon size={17} /><span>{label}</span><b>{value}</b></div>;
}

function ServiceCircle({ icon: Icon, label }) {
  return <div className="service-circle"><Icon size={27} /><span>{label}</span></div>;
}

function RelatedBookCard({ book, t }) {
  const cover = bookCoverUrl(book);
  const category = book.category?.name || book.category_name || t('undefinedCategory');
  return <article className="public-book-card compact-related-book">
    <Link to={`/catalog/${book.id}`} className="book-cover">
      {cover ? <img src={cover} alt={book.title} /> : <BookCoverFallback title={book.title} category={category} />}
    </Link>
    <div className="book-card-body">
      <h3><Link to={`/catalog/${book.id}`}>{book.title}</Link></h3>
      <p>{book.author?.name || book.author_name || t('undefinedAuthor')}</p>
    </div>
  </article>;
}

function BookCoverFallback({ title = 'Book', category = 'Library' }) {
  return (
    <div className="cover-fallback large-cover">
      <span>{category}</span>
      <strong>{title.split(' ').filter(Boolean).slice(0, 4).join(' ') || title}</strong>
      <small>Library System</small>
    </div>
  );
}
