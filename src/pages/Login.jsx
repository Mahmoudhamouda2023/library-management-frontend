import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, setSession } from '../api/client.js';
import { defaultRouteFor } from '../utils/routes.js';
import Alert from '../components/Alert.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Login() {
  const { dt } = useDashboardText();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest('/login', { method: 'POST', body: JSON.stringify(form) });
      setSession({ token: result.token, user: result.user });
      navigate(defaultRouteFor(result.user));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="login-box" onSubmit={submit}>
        <h1>{dt('loginTitle')}</h1>
        <p>{dt('loginText')}</p>
        <Alert type="error">{error}</Alert>
        <label>{dt('email')}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>{dt('password')}<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <button disabled={loading}>{loading ? dt('loggingIn') : dt('loginButton')}</button>
        <p className="auth-hint">{dt('noAccount')} <Link to="/register">{dt('registerMember')}</Link></p>
        <p className="auth-hint"><Link to="/catalog">{dt('backToCatalog')}</Link></p>
      </form>
    </div>
  );
}
