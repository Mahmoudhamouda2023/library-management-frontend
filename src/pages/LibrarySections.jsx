import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookMarked, ChevronLeft, Grid3X3, Layers3, Table2, Tags } from 'lucide-react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function fallbackCategories(t) {
  return [
    { id: 'science', name: t('fallbackScience'), code: 'SCI', description: t('sectionBooksHint') },
    { id: 'literature', name: t('fallbackLiterature'), code: 'LIT', description: t('sectionBooksHint') },
    { id: 'technology', name: t('fallbackTechnology'), code: 'TECH', description: t('sectionBooksHint') },
    { id: 'history', name: t('fallbackHistory'), code: 'HIST', description: t('sectionBooksHint') },
    { id: 'management', name: t('fallbackManagement'), code: 'MGT', description: t('sectionBooksHint') },
    { id: 'education', name: t('fallbackEducation'), code: 'EDU', description: t('sectionBooksHint') },
    { id: 'religion', name: t('fallbackReligion'), code: 'REL', description: t('sectionBooksHint') },
    { id: 'novel', name: t('fallbackNovel'), code: 'NOV', description: t('sectionBooksHint') },
  ];
}

export default function LibrarySections() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('cards');

  useEffect(() => {
    let alive = true;

    async function loadCategories() {
      setLoading(true);
      setError('');
      try {
        const response = await apiRequest('/public/categories');
        const list = getList(response);
        if (!alive) return;
        setCategories(list.length ? list : fallbackCategories(t));
      } catch {
        if (!alive) return;
        setCategories(fallbackCategories(t));
        setError(t('sectionsLoadError'));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadCategories();
    return () => { alive = false; };
  }, [t]);

  const columns = [
    {
      key: 'name',
      label: t('sectionName'),
      sortable: true,
      render: (category) => <Link className="table-book-link" to={`/catalog?category_id=${category.id}`}>{category.name}</Link>,
    },
    { key: 'code', label: t('sectionCode'), sortable: true, render: (category) => category.code || category.slug || category.id || '-' },
    { key: 'description', label: t('sectionDescription'), sortable: false, render: (category) => category.description || t('noDescriptionShort') },
  ];

  return (
    <main className="public-main official-public-main sections-page">
      <section className="catalog-hero-mini enhanced-page-hero">
        <div className="public-container split-page-hero">
          <div>
            <p><Layers3 size={18} /> {t('sectionsPageEyebrow')}</p>
            <h1>{t('sectionsPageTitle')}</h1>
            <span>{t('sectionsPageText')}</span>
          </div>
          <Link className="hero-outline-action" to="/catalog">
            {t('catalog')} <ArrowLeft size={17} />
          </Link>
        </div>
      </section>

      <section className="public-container page-content-stack">
        <Alert type="error">{error}</Alert>

        <div className="catalog-toolbar-row">
          <div>
            <strong>{categories.length}</strong>
            <span>{t('librarySections')}</span>
          </div>
          <div className="view-switcher">
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}><Grid3X3 size={17} /> {t('cards')}</button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Table2 size={17} /> {t('dataTable')}</button>
          </div>
        </div>

        {loading && <div className="empty-card">{t('loadingSections')}</div>}

        {!loading && view === 'cards' && (
          <div className="sections-grid">
            {categories.map((category) => (
              <Link className="section-card" key={category.id || category.name} to={`/catalog?category_id=${category.id || ''}`}>
                <span className="section-icon"><Tags size={24} /></span>
                <small>{category.code || category.slug || category.id || t('sections')}</small>
                <strong>{category.name}</strong>
                <p>{category.description || t('sectionBooksHint')}</p>
                <span className="section-action">
                  {t('browseSection')} <ChevronLeft size={16} />
                </span>
              </Link>
            ))}
          </div>
        )}

        {!loading && view === 'table' && (
          <DataTable
            title={t('sectionsDataTableTitle')}
            columns={columns}
            rows={categories}
            pageSize={10}
            searchable
            exportable
            actions={(category) => <Link className="table-action-link" to={`/catalog?category_id=${category.id || ''}`}>{t('open')}</Link>}
          />
        )}

        <section className="section-note-panel">
          <BookMarked size={28} />
          <div>
            <h2>{t('catalog')}</h2>
            <p>{t('sectionsPageText')}</p>
          </div>
          <Link className="button-link" to="/catalog">{t('showAll')}</Link>
        </section>
      </section>
    </main>
  );
}
