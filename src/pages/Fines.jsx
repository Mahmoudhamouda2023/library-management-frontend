import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function Fines() {
  const { dt, language } = useDashboardText();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load(){ try{ setRows(getList(await apiRequest('/fines'))); }catch(e){ setError(e.message); } }
  useEffect(()=>{load();},[]);

  async function action(row, type){
    try{
      await apiRequest(`/fines/${row.id}/${type}`, {method:'POST'});
      setSuccess(type === 'pay' ? dt('finePaid') : dt('fineWaived'));
      load();
    }catch(e){ setError(e.message); }
  }

  return <section>
    <h1>{dt('fines')}</h1>
    <Alert type="error">{error}</Alert>
    <Alert type="success">{success}</Alert>
    <DataTable rows={rows} columns={[
      {key:'member',label:dt('member'),render:r=>r.member?.name},
      {key:'book',label:dt('book'),render:r=>r.borrowing?.book?.title},
      {key:'days_late',label:dt('daysLate')},
      {key:'amount',label:dt('amount')},
      {key:'status',label:dt('status'), render:r=>translateStatusLabel(r.status, language)}
    ]} actions={(row)=>row.status==='unpaid'&&<><button className="small" onClick={()=>action(row,'pay')}>{dt('pay')}</button><button className="small danger" onClick={()=>action(row,'waive')}>{dt('waive')}</button></>} />
  </section>;
}
