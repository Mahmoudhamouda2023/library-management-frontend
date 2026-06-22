import { useEffect, useState } from 'react';
import ResourcePage from './ResourcePage.jsx';
import { apiRequest, getList } from '../api/client.js';
import { bookCoverUrl } from '../utils/media.js';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Books() {
  const { dt } = useDashboardText();
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    Promise.all([
      apiRequest('/authors').then(getList).catch(() => []),
      apiRequest('/categories').then(getList).catch(() => []),
    ]).then(([a, c]) => { setAuthors(a); setCategories(c); });
  }, []);

  return <ResourcePage
    title={dt('books')}
    endpoint="/books"
    columns={[
      { key: 'cover', label: dt('cover'), sortable: false, render: (r) => <BookThumb book={r} noCover={dt('noCover')} /> },
      { key: 'title', label: dt('title') },
      { key: 'isbn', label: 'ISBN' },
      { key: 'author', label: dt('author'), render: (r) => r.author?.name || r.author_name || '-' },
      { key: 'category', label: dt('category'), render: (r) => r.category?.name || r.category_name || '-' },
      { key: 'available_copies', label: dt('available') },
      { key: 'review_status', label: dt('reviewStatus') },
      { key: 'status', label: dt('status') },
    ]}
    fields={[
      { name: 'title', label: dt('bookTitle'), required: true },
      { name: 'isbn', label: 'ISBN', required: true },
      { name: 'cover_image', label: dt('bookCoverImage'), type: 'file', accept: 'image/*' },
      { name: 'author_id', label: dt('author'), type: 'select', required: true, options: authors.map((x) => ({ value: x.id, label: x.name })) },
      { name: 'category_id', label: dt('category'), type: 'select', required: true, options: categories.map((x) => ({ value: x.id, label: x.name })) },
      { name: 'published_year', label: dt('publishedYear'), type: 'number' },
      { name: 'total_copies', label: dt('totalCopies'), type: 'number', required: true },
      { name: 'available_copies', label: dt('availableCopies'), type: 'number' },
      { name: 'shelf_location', label: dt('shelfLocation') },
      { name: 'status', label: dt('status'), type: 'select', options: [{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }] },
      { name: 'description', label: dt('bookDescription'), type: 'textarea' },
    ]}
  />;
}

function BookThumb({ book, noCover }) {
  const cover = bookCoverUrl(book);
  return cover ? <img className="admin-book-thumb" src={cover} alt={book.title} /> : <span className="thumb-placeholder">{noCover}</span>;
}
