import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, setSession } from '../api/client.js';
import Alert from '../components/Alert.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Register() {
  const { dt } = useDashboardText();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest('/register', { method: 'POST', body: JSON.stringify(form) });
      setSession({ token: result.token, user: result.user });
      navigate('/my');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="login-box" onSubmit={submit}>
        <h1>{dt('registerTitle')}</h1>
        <p>{dt('registerText')}</p>
        <Alert type="error">{error}</Alert>
        <label>{dt('name')}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>{dt('email')}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>{dt('password')}<input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <label>{dt('passwordConfirmation')}<input type="password" minLength="6" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required /></label>
        <button disabled={loading}>{loading ? dt('creatingAccount') : dt('createAccount')}</button>
        <p className="auth-hint">{dt('haveAccount')} <Link to="/login">{dt('loginLink')}</Link></p>
      </form>
    </div>
  );
}
