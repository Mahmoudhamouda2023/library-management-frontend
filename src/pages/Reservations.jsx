import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function Reservations() {
  const { dt, language } = useDashboardText();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load(){ try{ setRows(getList(await apiRequest('/reservations'))); }catch(e){ setError(e.message); } }
  useEffect(()=>{load();},[]);

  async function action(row, type){
    try{
      await apiRequest(`/reservations/${row.id}/${type}`, {method:'POST'});
      setSuccess(type === 'cancel' ? dt('reservationCancelled') : dt('reservationFulfilled'));
      load();
    }catch(e){ setError(e.message); }
  }

  return <section>
    <h1>{dt('reservations')}</h1>
    <Alert type="error">{error}</Alert>
    <Alert type="success">{success}</Alert>
    <DataTable rows={rows} columns={[
      {key:'member',label:dt('member'),render:r=>r.member?.name},
      {key:'book',label:dt('book'),render:r=>r.book?.title},
      {key:'reserved_at',label:dt('reservedAt')},
      {key:'expires_at',label:dt('expiresAt')},
      {key:'status',label:dt('status'), render:r=>translateStatusLabel(r.status, language)}
    ]} actions={(row)=><>{row.status==='pending'&&<button className="small" onClick={()=>action(row,'fulfill')}>{dt('fulfill')}</button>}{row.status==='pending'&&<button className="small danger" onClick={()=>action(row,'cancel')}>{dt('cancelReservation')}</button>}</>} />
  </section>;
}
