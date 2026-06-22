import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function ResourcePage({ title, endpoint, columns, fields, searchPlaceholder, canCreate = true, canEdit = true, canDelete = true }) {
  const { dt } = useDashboardText();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(undefined);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : '';
      const result = await apiRequest(`${endpoint}${query}`);
      setRows(getList(result));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({});
  }

  function openEdit(row) {
    setEditing(row);
    const next = { ...row };
    if (row.author?.id) next.author_id = row.author.id;
    if (row.category?.id) next.category_id = row.category.id;
    if (row.cover_url || row.cover_image_url || row.cover_path || row.cover_image || row.cover) {
      next.cover_image = row.cover_url || row.cover_image_url || row.cover_path || row.cover_image || row.cover;
    }
    if (row.photo_url || row.avatar_url || row.photo_path || row.photo || row.image_url || row.image) {
      next.photo = row.photo_url || row.avatar_url || row.photo_path || row.photo || row.image_url || row.image;
    }
    setForm(next);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const hasFile = fields.some((field) => field.type === 'file' && form[field.name] instanceof File);
      const path = editing ? `${endpoint}/${editing.id}` : endpoint;

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

      setSuccess(editing ? dt('updateSuccess') : dt('createSuccess'));
      setEditing(undefined);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function destroy(row) {
    if (!confirm(dt('deleteConfirm'))) return;
    try {
      await apiRequest(`${endpoint}/${row.id}`, { method: 'DELETE' });
      setSuccess(dt('deleteSuccess'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const modalOpen = editing === null || editing;

  return (
    <section>
      <div className="page-head">
        <h1>{title}</h1>
        {canCreate && <button onClick={openCreate}>{dt('addNew')}</button>}
      </div>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>
      <div className="toolbar">
        <input placeholder={searchPlaceholder || dt('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="secondary" onClick={load}>{loading ? dt('loading') : dt('searchUpdate')}</button>
      </div>
      <DataTable title={title} columns={columns} rows={rows} actions={(row) => (
        <>
          {canEdit && <button className="small" onClick={() => openEdit(row)}>{dt('edit')}</button>}
          {canDelete && <button className="small danger" onClick={() => destroy(row)}>{dt('delete')}</button>}
        </>
      )} />
      {modalOpen && (
        <Modal title={`${editing ? dt('editResource') : dt('addResource')} ${title}`} onClose={() => setEditing(undefined)}>
          <ResourceForm fields={fields} value={form} onChange={setForm} onSubmit={submit} onCancel={() => setEditing(undefined)} submitting={submitting} />
        </Modal>
      )}
    </section>
  );
}
