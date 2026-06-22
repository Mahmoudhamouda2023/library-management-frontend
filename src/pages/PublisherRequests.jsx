import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';
import { personImageUrl } from '../utils/media.js';

export default function PublisherRequests(){
 const { dt, language } = useDashboardText();
 const [rows,setRows]=useState([]);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');

 async function load(){try{setRows(getList(await apiRequest('/publisher-requests')))}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[]);

 async function approve(row){
  try{
   await apiRequest(`/publisher-requests/${row.id}/approve`,{method:'POST'});
   setSuccess(dt('publisherApproved'));
   load();
  }catch(e){setError(e.message)}
 }

 async function reject(row){
  const rejection_reason=prompt(dt('rejectReason'));
  if(rejection_reason===null)return;
  try{
   await apiRequest(`/publisher-requests/${row.id}/reject`,{method:'POST',body:JSON.stringify({rejection_reason})});
   setSuccess(dt('publisherRejected'));
   load();
  }catch(e){setError(e.message)}
 }

 return <section>
  <h1>{dt('publisherRequestsTitle')}</h1>
  <Alert type="error">{error}</Alert>
  <Alert type="success">{success}</Alert>
  <DataTable rows={rows} columns={[
    {key:'photo',label:dt('photo'),render:r=><PublisherRequestPhoto row={r} />},
    {key:'user',label:dt('user'),render:r=>r.user?.name},
    {key:'display_name',label:dt('displayName')},
    {key:'nationality',label:dt('nationality')},
    {key:'status',label:dt('status'), render:r=>translateStatusLabel(r.status, language)}
  ]} actions={(row)=>row.status==='pending'&&<><button className="small" onClick={()=>approve(row)}>{dt('approve')}</button><button className="small danger" onClick={()=>reject(row)}>{dt('reject')}</button></>} />
 </section>;
}

function PublisherRequestPhoto({ row }) {
  const photo = personImageUrl(row) || personImageUrl(row?.user);
  return photo ? <img className="admin-author-thumb" src={photo} alt={row?.display_name || row?.user?.name || 'publisher'} /> : <span className="author-avatar-mini">{String(row?.display_name || row?.user?.name || 'P').slice(0, 1)}</span>;
}
