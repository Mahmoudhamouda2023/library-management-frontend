import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { bookCoverUrl, personImageUrl } from '../utils/media.js';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function PublisherPortal() {
  const { dt, language } = useDashboardText();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'dashboard');
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function load(next = tab) {
    setTab(next);
    setSearchParams(next === 'dashboard' ? {} : { tab: next });
    setError('');
    setSuccess('');

    try {
      const path = next === 'dashboard' ? '/publisher/dashboard' : '/publisher/books';
      const res = await apiRequest(path);
      setData(next === 'dashboard' ? (res.data || res) : getList(res));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load(searchParams.get('tab') || 'dashboard');

    apiRequest('/public/categories')
      .then((res) => setCategories(getList(res)))
      .catch(() => setCategories([]));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({});
    setModal(true);
  }

  function openEdit(row) {
    const next = { ...row };
    if (row.category?.id) next.category_id = row.category.id;
    if (row.cover_url || row.cover_image_url || row.cover_path || row.cover_image || row.cover) {
      next.cover_image = row.cover_url || row.cover_image_url || row.cover_path || row.cover_image || row.cover;
    }
    setEditing(row);
    setForm(next);
    setModal(true);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const fields = publisherBookFields(categories, dt);
      const hasFile = fields.some((field) => field.type === 'file' && form[field.name] instanceof File);
      const path = editing ? `/publisher/books/${editing.id}` : '/publisher/books';

      if (hasFile) {
        const formData = new FormData();
        if (editing) formData.append('_method', 'PUT');

        fields.forEach((field) => {
          const value = form[field.name];
          if (value === undefined || value === null || value === '') return;
          if (field.type === 'file' && !(value instanceof File)) return;
          formData.append(field.name, value);
        });

        await apiRequest(path, {
          method: 'POST',
          body: formData,
        });
      } else {
        const cleanPayload = {};
        fields.forEach((field) => {
          const value = form[field.name];
          if (field.type === 'file') return;
          if (value !== undefined && value !== null) cleanPayload[field.name] = value;
        });

        await apiRequest(path, {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(cleanPayload),
        });
      }

      setModal(false);
      setEditing(null);
      setForm({});
      setSuccess(editing ? dt('updateSuccess') : dt('publisherBookSent'));
      load('books');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function destroy(row) {
    if (!confirm(dt('deleteBookConfirm'))) return;

    try {
      await apiRequest(`/publisher/books/${row.id}`, {
        method: 'DELETE',
      });

      setSuccess(dt('deletedOrDisabled'));
      load('books');
    } catch (e) {
      setError(e.message);
    }
  }

  const author = getAuthor(data);
  const authorPhoto = personImageUrl(author);

  return <section>
    <div className="page-head">
      <h1>{dt('publisherPortal')}</h1>

      {tab === 'books' &&
        <button onClick={openCreate}>
          {dt('addBook')}
        </button>
      }
    </div>

    <div className="tabs">
      <button onClick={() => load('dashboard')}>{dt('publisherHome')}</button>
      <button onClick={() => load('books')}>{dt('myBooks')}</button>
    </div>

    <Alert type="error">{error}</Alert>
    <Alert type="success">{success}</Alert>

    {tab === 'dashboard' && data && <>
      <div className="publisher-profile-card">
        <div className="publisher-avatar">
          {authorPhoto ? <img src={authorPhoto} alt={author?.name || 'author'} /> : <span>{String(author?.name || dt('publisherRole')).slice(0, 1)}</span>}
        </div>
        <div>
          <h3>{author?.name || dt('authorData')}</h3>
          <p><b>{dt('nationality')}:</b> {author?.nationality || '-'}</p>
          <p><b>{dt('birthDate')}:</b> {author?.birth_date || '-'}</p>
          <p><b>{dt('bio')}:</b> {author?.bio || '-'}</p>
        </div>
      </div>

      <div className="cards">
        {publisherDashboardMetrics(data, dt).map((item) => (
          <div className="card" key={item.key}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </>}

    {tab === 'books' && Array.isArray(data) &&
      <DataTable
        title={dt('publisherBooks')}
        rows={data}
        columns={[
          { key: 'cover', label: dt('cover'), sortable: false, render: (r) => <BookThumb book={r} noCover={dt('noCover')} /> },
          { key: 'title', label: dt('title') },
          { key: 'isbn', label: 'ISBN' },
          { key: 'category', label: dt('category'), render: r => r.category?.name || '-' },
          { key: 'available_copies', label: dt('available') },
          { key: 'review_status', label: dt('review'), render: r => translateStatusLabel(r.review_status, language) },
          { key: 'review_note', label: dt('reviewNote'), render: r => r.review_note || '-' },
          { key: 'status', label: dt('status'), render: r => translateStatusLabel(r.status, language) },
        ]}
        actions={r => <>
          <button className="small" onClick={() => openEdit(r)}>{dt('edit')}</button>
          <button className="small danger" onClick={() => destroy(r)}>{dt('delete')}</button>
        </>}
      />
    }

    {modal &&
      <Modal title={editing ? dt('editResource') : dt('addPublisherBook')} onClose={() => setModal(false)}>
        <ResourceForm
          value={form}
          onChange={setForm}
          onSubmit={submit}
          onCancel={() => setModal(false)}
          submitting={submitting}
          fields={publisherBookFields(categories, dt)}
        />
      </Modal>
    }
  </section>;
}

function publisherBookFields(categories, dt) {
  return [
    { name: 'title', label: dt('title'), required: true },
    { name: 'isbn', label: 'ISBN', required: true },
    { name: 'cover_image', label: dt('bookCoverImage'), type: 'file', accept: 'image/*' },
    {
      name: 'category_id',
      label: dt('category'),
      type: 'select',
      required: true,
      options: categories.map((x) => ({ value: x.id, label: x.name })),
    },
    { name: 'published_year', label: dt('publishedYear'), type: 'number' },
    { name: 'total_copies', label: dt('totalCopies'), type: 'number', required: true },
    { name: 'available_copies', label: dt('availableCopies'), type: 'number' },
    { name: 'shelf_location', label: dt('shelfLocation') },
    { name: 'description', label: dt('description'), type: 'textarea' },
  ];
}

function BookThumb({ book, noCover }) {
  const cover = bookCoverUrl(book);
  return cover ? <img className="admin-book-thumb" src={cover} alt={book.title} /> : <span className="thumb-placeholder">{noCover}</span>;
}

function getAuthor(data) {
  if (!data) return null;
  if (data.author?.data) return data.author.data;
  if (data.author) return data.author;
  if (data.publisher?.data) return data.publisher.data;
  if (data.publisher) return data.publisher;
  return null;
}

function publisherDashboardMetrics(data, dt) {
  return [
    { key: 'books_count', label: dt('myBooksCount'), value: pickFirst(data, ['books_count', 'total_books', 'my_books_count'], 0) },
    { key: 'active_books_count', label: dt('activeBooks'), value: pickFirst(data, ['active_books_count', 'active_books'], 0) },
    { key: 'inactive_books_count', label: dt('inactiveBooksCount'), value: pickFirst(data, ['inactive_books_count', 'inactive_books'], 0) },
    { key: 'pending_books_count', label: dt('pendingReview'), value: pickFirst(data, ['pending_books_count', 'pending_review_count', 'pending_books'], 0) },
    { key: 'approved_books_count', label: dt('approvedBooks'), value: pickFirst(data, ['approved_books_count', 'approved_books'], 0) },
    { key: 'rejected_books_count', label: dt('rejectedBooks'), value: pickFirst(data, ['rejected_books_count', 'rejected_books'], 0) },
    { key: 'total_copies', label: dt('totalCopies'), value: pickFirst(data, ['total_copies'], 0) },
    { key: 'available_copies', label: dt('availableCopies'), value: pickFirst(data, ['available_copies'], 0) },
  ];
}

function pickFirst(obj, keys, defaultValue = '-') {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return defaultValue;
}
