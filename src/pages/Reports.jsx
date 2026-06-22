import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Reports(){
 const { dt } = useDashboardText();
 const [data,setData]=useState({});
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);

 useEffect(()=>{
  setLoading(true);

  apiRequest('/reports/summary')
   .then(res=>{
    setData(res.data || res || {});
   })
   .catch(e=>{
    setError(e.message);
   })
   .finally(()=>{
    setLoading(false);
   });
 },[]);

 return <section>
  <h1>{dt('reports')}</h1>

  <Alert type="error">{error}</Alert>

  {loading && <p className="muted">{dt('loadingReports')}</p>}

  {!loading && <>
   <h2 className="section-title">{dt('generalSummary')}</h2>

   <div className="cards">
    <ReportCard title={dt('authorsCount')} value={pickFirst(data, ['authors_count', 'total_authors'])} />
    <ReportCard title={dt('categoriesCount')} value={pickFirst(data, ['categories_count', 'total_categories'])} />
   </div>

   <h2 className="section-title">{dt('bookReports')}</h2>

   <div className="cards">
    <ReportCard title={dt('totalBooks')} value={pickFirst(data.books, ['total_books', 'books_count', 'total'])} />
    <ReportCard title={dt('activeBooks')} value={pickFirst(data.books, ['active_books', 'active_books_count', 'active'])} />
    <ReportCard title={dt('inactiveBooks')} value={pickFirst(data.books, ['inactive_books', 'inactive_books_count', 'inactive'])} />
    <ReportCard title={dt('totalCopies')} value={pickFirst(data.books, ['total_copies'])} />
    <ReportCard title={dt('availableCopies')} value={pickFirst(data.books, ['available_copies'])} />
    <ReportCard title={dt('borrowedCopies')} value={pickFirst(data.books, ['borrowed_copies'])} />
   </div>

   <h2 className="section-title">{dt('memberReports')}</h2>

   <div className="cards">
    <ReportCard title={dt('totalMembers')} value={pickFirst(data.members, ['total_members', 'members_count', 'total'])} />
    <ReportCard title={dt('activeMembers')} value={pickFirst(data.members, ['active_members', 'active_members_count', 'active'])} />
    <ReportCard title={dt('inactiveMembers')} value={pickFirst(data.members, ['inactive_members', 'inactive_members_count', 'inactive'])} />
    <ReportCard title={dt('suspendedMembers')} value={pickFirst(data.members, ['suspended_members', 'suspended_members_count', 'suspended'])} />
   </div>

   <h2 className="section-title">{dt('borrowingReports')}</h2>

   <div className="cards">
    <ReportCard title={dt('totalBorrowings')} value={pickFirst(data.borrowings, ['total_borrowings', 'borrowings_count', 'total'])} />
    <ReportCard title={dt('currentlyBorrowed')} value={pickFirst(data.borrowings, ['currently_borrowed', 'active_borrowings', 'borrowed'])} />
    <ReportCard title={dt('returnedBorrowings')} value={pickFirst(data.borrowings, ['returned', 'returned_borrowings'])} />
    <ReportCard title={dt('overdueBorrowings')} value={pickFirst(data.borrowings, ['overdue', 'overdue_borrowings'])} />
   </div>

   <h2 className="section-title">{dt('reservationReports')}</h2>

   <div className="cards">
    <ReportCard title={dt('totalReservations')} value={pickFirst(data.reservations, ['total_reservations', 'reservations_count', 'total'])} />
    <ReportCard title={dt('pendingReservations')} value={pickFirst(data.reservations, ['pending', 'pending_reservations'])} />
    <ReportCard title={dt('cancelledReservations')} value={pickFirst(data.reservations, ['cancelled', 'canceled', 'cancelled_reservations'])} />
    <ReportCard title={dt('fulfilledReservations')} value={pickFirst(data.reservations, ['fulfilled', 'fulfilled_reservations'])} />
    <ReportCard title={dt('expiredReservations')} value={pickFirst(data.reservations, ['expired', 'expired_reservations'])} />
   </div>
  </>}
 </section>;
}

function ReportCard({title,value}){
 return <div className="card">
  <span>{title}</span>
  <strong>{value ?? 0}</strong>
 </div>;
}

function pickFirst(obj, keys, defaultValue = 0){
 if(!obj) return defaultValue;
 for(const key of keys){
  if(obj[key] !== undefined && obj[key] !== null){
   return obj[key];
  }
 }
 return defaultValue;
}
