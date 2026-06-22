import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth.jsx';
import RequireRole from './auth/RequireRole.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PublicHome from './pages/PublicHome.jsx';
import Catalog from './pages/Catalog.jsx';
import PublicBookDetails from './pages/PublicBookDetails.jsx';
import LibrarySections from './pages/LibrarySections.jsx';
import PublisherServices from './pages/PublisherServices.jsx';
import PublicAuthors from './pages/PublicAuthors.jsx';

import Home from './pages/Home.jsx';
import Books from './pages/Books.jsx';
import Authors from './pages/Authors.jsx';
import Categories from './pages/Categories.jsx';
import Members from './pages/Members.jsx';
import Borrowings from './pages/Borrowings.jsx';
import Reservations from './pages/Reservations.jsx';
import Fines from './pages/Fines.jsx';
import Reports from './pages/Reports.jsx';
import PendingBooks from './pages/PendingBooks.jsx';
import PublisherRequests from './pages/PublisherRequests.jsx';

import MemberPortal from './pages/MemberPortal.jsx';
import PublisherPortal from './pages/PublisherPortal.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Messages from './pages/Messages.jsx';
import Notifications from './pages/Notifications.jsx';

function ProtectedByRole({ roles, children }) {
  return <RequireAuth><RequireRole roles={roles}>{children}</RequireRole></RequireAuth>;
}

export default function App() {
  return (
    <Routes>
      {/* الموقع الخارجي */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHome />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<PublicBookDetails />} />
        <Route path="/sections" element={<LibrarySections />} />
        <Route path="/publisher-services" element={<PublisherServices />} />
        <Route path="/authors" element={<PublicAuthors />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/my" element={<ProtectedByRole roles={['member']}><MemberPortal /></ProtectedByRole>} />
        <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      </Route>

      {/* Admin فقط */}
      <Route element={<ProtectedByRole roles={['admin']}><DashboardLayout /></ProtectedByRole>}>
        <Route path="/admin" element={<Home />} />
        <Route path="/admin/books" element={<Books />} />
        <Route path="/admin/authors" element={<Authors />} />
        <Route path="/admin/categories" element={<Categories />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/borrowings" element={<Borrowings />} />
        <Route path="/admin/reservations" element={<Reservations />} />
        <Route path="/admin/fines" element={<Fines />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/books/pending" element={<PendingBooks />} />
        <Route path="/admin/publisher-requests" element={<PublisherRequests />} />
        <Route path="/admin/messages" element={<Messages />} />
        <Route path="/admin/notifications" element={<Notifications />} />
      </Route>

      {/* Librarian فقط */}
      <Route element={<ProtectedByRole roles={['librarian']}><DashboardLayout /></ProtectedByRole>}>
        <Route path="/librarian" element={<Home />} />
        <Route path="/librarian/books" element={<Books />} />
        <Route path="/librarian/authors" element={<Authors />} />
        <Route path="/librarian/categories" element={<Categories />} />
        <Route path="/librarian/members" element={<Members />} />
        <Route path="/librarian/borrowings" element={<Borrowings />} />
        <Route path="/librarian/reservations" element={<Reservations />} />
        <Route path="/librarian/fines" element={<Fines />} />
        <Route path="/librarian/reports" element={<Reports />} />
        <Route path="/librarian/messages" element={<Messages />} />
        <Route path="/librarian/notifications" element={<Notifications />} />
      </Route>

      {/* Publisher / الناشر أو المؤلف فقط */}
      <Route element={<ProtectedByRole roles={['publisher']}><DashboardLayout /></ProtectedByRole>}>
        <Route path="/publisher" element={<PublisherPortal />} />
      </Route>

      {/* روابط قديمة حتى لا تخرب عندك إذا فتحتها من المتصفح */}
      <Route path="/books" element={<Navigate to="/catalog" replace />} />
      <Route path="/categories" element={<Navigate to="/sections" replace />} />
      <Route path="/members" element={<Navigate to="/admin/members" replace />} />
      <Route path="/borrowings" element={<Navigate to="/admin/borrowings" replace />} />
      <Route path="/reservations" element={<Navigate to="/admin/reservations" replace />} />
      <Route path="/fines" element={<Navigate to="/admin/fines" replace />} />
      <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
      <Route path="/publisher-requests" element={<Navigate to="/admin/publisher-requests" replace />} />
      <Route path="/publishers" element={<Navigate to="/publisher-services" replace />} />
      <Route path="/account" element={<Navigate to="/profile" replace />} />
      <Route path="/publisher-services-old" element={<Navigate to="/publisher-services" replace />} />

      {/* روابط أمين المكتبة المختصرة */}
      <Route path="/librarian-dashboard" element={<Navigate to="/librarian" replace />} />
      <Route path="/library" element={<Navigate to="/librarian" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
