import { useEffect, useState } from 'react';
import { apiRequest, getList } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import DataTable from '../components/DataTable.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';

export default function PendingBooks(){
 const { dt, language } = useDashboardText();
 const [rows,setRows]=useState([]);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');

 async function load(){try{setRows(getList(await apiRequest('/admin/books/pending')))}catch(e){setError(e.message)}}
 useEffect(()=>{load()},[]);

 async function approve(row){
  try{
   await apiRequest(`/admin/books/${row.id}/approve`,{method:'POST'});
   setSuccess(dt('approvedSuccess'));
   load();
  }catch(e){setError(e.message)}
 }

 async function reject(row){
  const reason=prompt(dt('rejectReason'));
  if(reason===null)return;
  try{
   await apiRequest(`/admin/books/${row.id}/reject`,{method:'POST',body:JSON.stringify({review_note:reason})});
   setSuccess(dt('rejectedSuccess'));
   load();
  }catch(e){setError(e.message)}
 }

 return <section>
  <h1>{dt('pendingBooksTitle')}</h1>
  <Alert type="error">{error}</Alert>
  <Alert type="success">{success}</Alert>
  <DataTable rows={rows} columns={[
    {key:'title',label:dt('title')},
    {key:'author',label:dt('author'),render:r=>r.author?.name},
    {key:'category',label:dt('category'),render:r=>r.category?.name},
    {key:'review_status',label:dt('status'), render:r=>translateStatusLabel(r.review_status, language)}
  ]} actions={(row)=><><button className="small" onClick={()=>approve(row)}>{dt('approve')}</button><button className="small danger" onClick={()=>reject(row)}>{dt('reject')}</button></>} />
 </section>;
}
