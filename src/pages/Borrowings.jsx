import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function Borrowings() {
  const { dt, language } = useDashboardText();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  async function load() {
    try { setRows(getList(await apiRequest('/borrowings'))); }
    catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await apiRequest('/borrowings', { method: 'POST', body: JSON.stringify(form) });
      setModal(false);
      setSuccess(dt('borrowingAdded'));
      load();
    } catch (e) { setError(e.message); }
  }

  async function returnBook(row) {
    try {
      await apiRequest(`/borrowings/${row.id}/return`, { method: 'POST' });
      setSuccess(dt('bookReturned'));
      load();
    } catch (e) { setError(e.message); }
  }

  return <section>
    <div className="page-head"><h1>{dt('borrowings')}</h1><button onClick={() => setModal(true)}>{dt('addBorrowing')}</button></div>
    <Alert type="error">{error}</Alert>
    <Alert type="success">{success}</Alert>
    <DataTable rows={rows} columns={[
      { key: 'member', label: dt('member'), render: r => r.member?.name },
      { key: 'book', label: dt('book'), render: r => r.book?.title },
      { key: 'borrowed_at', label: dt('borrowedAt') },
      { key: 'due_date', label: dt('dueDate') },
      { key: 'status', label: dt('status'), render: r => translateStatusLabel(r.status, language) }
    ]} actions={(row) => row.status === 'borrowed' && <button className="small" onClick={() => returnBook(row)}>{dt('return')}</button>} />

    {modal && <Modal title={dt('addBorrowing')} onClose={() => setModal(false)}>
      <ResourceForm value={form} onChange={setForm} onSubmit={submit} onCancel={() => setModal(false)} fields={[
        { name: 'member_id', label: dt('memberId'), type: 'number', required: true },
        { name: 'book_id', label: dt('bookId'), type: 'number', required: true },
        { name: 'borrowed_at', label: dt('borrowedAt'), type: 'date' },
        { name: 'due_date', label: dt('dueDate'), type: 'date' },
        { name: 'notes', label: dt('notes'), type: 'textarea' }
      ]} />
    </Modal>}
  </section>;
}
